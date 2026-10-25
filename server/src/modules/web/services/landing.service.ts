import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Op } from 'sequelize';
import { BusinessException } from '../../../common/exceptions/business.exception';
import urlUtil from '../../../common/utils/url.util';
import { LandingPage } from '../../../models/landing-page.model';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TEMPLATES_DIR = path.resolve(__dirname, '../../../../views/landing/templates');
const DEFAULT_TEMPLATE = 'default.hbs';
const TEMPLATE_FILE_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*\.hbs$/;

@Injectable()
export class LandingService {
  constructor(
    @InjectModel(LandingPage)
    private readonly landingPageModel: typeof LandingPage,
  ) {}

  async adminList(listReq: any) {
    try {
      const pageNo = Math.max(parseInt(listReq.pageNo, 10) || 1, 1);
      const pageSize = Math.min(Math.max(parseInt(listReq.pageSize, 10) || 15, 1), 100);
      const keyword = typeof listReq.keyword === 'string' ? listReq.keyword.trim() : '';

      const where: any = { isDelete: 0 };
      if (keyword) {
        where[Op.or] = [
          { title: { [Op.like]: `%${keyword}%` } },
          { slug: { [Op.like]: `%${keyword}%` } },
        ];
      }
      if (listReq.isShow !== undefined && listReq.isShow !== '') {
        where.isShow = Number(listReq.isShow) === 1 ? 1 : 0;
      }

      const { count, rows } = await this.landingPageModel.findAndCountAll({
        where,
        limit: pageSize,
        offset: pageSize * (pageNo - 1),
        order: [
          ['sort', 'DESC'],
          ['id', 'DESC'],
        ],
      });

      return {
        pageNo,
        pageSize,
        count,
        lists: rows.map(row => this.toAdminPage(row, false)),
      };
    } catch (err) {
      this.rethrow(err, 'LandingService.adminList error');
    }
  }

  async adminDetail(id: number) {
    try {
      const page = await this.findExisting(id);
      return this.toAdminPage(page);
    } catch (err) {
      this.rethrow(err, 'LandingService.adminDetail error');
    }
  }

  async adminAdd(addReq: any) {
    try {
      const payload = this.buildPayload(addReq);
      await this.ensureTemplateValid(payload.templateFile);
      await this.ensureSlugUnique(payload.slug);

      const now = Math.floor(Date.now() / 1000);
      const page = await this.landingPageModel.create({
        ...payload,
        createTime: now,
        updateTime: now,
      } as any);

      return this.toAdminPage(page);
    } catch (err) {
      this.rethrow(err, 'LandingService.adminAdd error');
    }
  }

  async adminEdit(editReq: any) {
    try {
      const page = await this.findExisting(editReq.id);
      const payload = this.buildPayload(editReq);
      await this.ensureTemplateValid(payload.templateFile);
      await this.ensureSlugUnique(payload.slug, page.id);

      await page.update({
        ...payload,
        updateTime: Math.floor(Date.now() / 1000),
      });

      return this.toAdminPage(page);
    } catch (err) {
      this.rethrow(err, 'LandingService.adminEdit error');
    }
  }

  async adminDel(delReq: any) {
    try {
      const page = await this.findExisting(delReq.id);
      const now = Math.floor(Date.now() / 1000);
      await page.update({ isDelete: 1, deleteTime: now, updateTime: now });
    } catch (err) {
      this.rethrow(err, 'LandingService.adminDel error');
    }
  }

  async adminChange(changeReq: any) {
    try {
      if (changeReq.isShow === undefined || changeReq.isShow === null || changeReq.isShow === '') {
        throw new BusinessException('请选择页面状态');
      }
      const page = await this.findExisting(changeReq.id);
      await page.update({
        isShow: Number(changeReq.isShow) === 1 ? 1 : 0,
        updateTime: Math.floor(Date.now() / 1000),
      });
    } catch (err) {
      this.rethrow(err, 'LandingService.adminChange error');
    }
  }

  async findPublishedBySlug(slug: string) {
    try {
      const normalized = String(slug || '')
        .trim()
        .toLowerCase();
      if (!SLUG_RE.test(normalized)) {
        return null;
      }

      const page = await this.landingPageModel.findOne({
        where: { slug: normalized, isShow: 1, isDelete: 0 },
      });
      return page ? this.toPublicPage(page) : null;
    } catch (err) {
      this.rethrow(err, 'LandingService.findPublishedBySlug error');
    }
  }

  async findDefaultPublished() {
    try {
      const page = await this.landingPageModel.findOne({
        where: { isShow: 1, isDelete: 0 },
        order: [
          ['sort', 'DESC'],
          ['id', 'DESC'],
        ],
      });
      return page ? this.toPublicPage(page) : null;
    } catch (err) {
      this.rethrow(err, 'LandingService.findDefaultPublished error');
    }
  }

  async findAllPublished() {
    try {
      const pages = await this.landingPageModel.findAll({
        where: { isShow: 1, isDelete: 0 },
        attributes: ['id', 'slug', 'updateTime'],
        order: [
          ['sort', 'DESC'],
          ['id', 'DESC'],
        ],
      });
      return pages.map(page => page.toJSON());
    } catch (err) {
      this.rethrow(err, 'LandingService.findAllPublished error');
    }
  }

  async listTemplates() {
    try {
      const entries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
      return entries
        .filter(entry => entry.isFile() && TEMPLATE_FILE_RE.test(entry.name))
        .map(entry => ({ value: entry.name, label: entry.name }))
        .sort((a, b) => {
          if (a.value === DEFAULT_TEMPLATE) return -1;
          if (b.value === DEFAULT_TEMPLATE) return 1;
          return a.value.localeCompare(b.value);
        });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      this.rethrow(err, 'LandingService.listTemplates error');
    }
  }

  async resolveTemplateView(templateFile?: string) {
    const file = String(templateFile || '').trim() || DEFAULT_TEMPLATE;
    if (TEMPLATE_FILE_RE.test(file)) {
      try {
        await fs.access(path.join(TEMPLATES_DIR, file));
        return `landing/templates/${file.replace(/\.hbs$/i, '')}`;
      } catch {
        // 模板文件被删除时回退到默认模板
      }
    }
    return `landing/templates/${DEFAULT_TEMPLATE.replace(/\.hbs$/i, '')}`;
  }

  private buildPayload(req: any) {
    const title = this.cleanText(req.title, '页面标题', 200);
    if (!title) {
      throw new BusinessException('请输入页面标题');
    }

    const slug = this.cleanText(req.slug, '访问别名', 100).toLowerCase();
    if (!SLUG_RE.test(slug)) {
      throw new BusinessException('访问别名只能包含小写字母、数字和中划线');
    }

    const ctaLink = this.cleanText(req.ctaLink, '按钮链接', 500);
    if (ctaLink && !/^https?:\/\//i.test(ctaLink) && !ctaLink.startsWith('/')) {
      throw new BusinessException('按钮链接仅支持 http(s):// 或 / 开头的地址');
    }

    const templateFile = this.cleanText(req.templateFile, '落地页模板', 100) || DEFAULT_TEMPLATE;
    const sortValue = Number(req.sort);
    return {
      title,
      slug,
      subtitle: this.cleanText(req.subtitle, '副标题', 300),
      cover: urlUtil.toRelativeUrl(this.cleanText(req.cover, '封面图', 255)),
      ctaText: this.cleanText(req.ctaText, '按钮文案', 100),
      ctaLink,
      templateFile,
      content: this.cleanContent(req.content),
      seoTitle: this.cleanText(req.seoTitle, 'SEO 标题', 200),
      seoKeywords: this.cleanText(req.seoKeywords, 'SEO 关键词', 255),
      seoDescription: this.cleanText(req.seoDescription, 'SEO 描述', 500),
      sort: Math.max(0, Number.isFinite(sortValue) ? Math.trunc(sortValue) : 0),
      isShow: Number(req.isShow) === 1 ? 1 : 0,
    };
  }

  private cleanText(value: any, label: string, maxLength: number) {
    const text = value === undefined || value === null ? '' : String(value).trim();
    if (text.length > maxLength) {
      throw new BusinessException(`${label}不能超过 ${maxLength} 个字符`);
    }
    return text;
  }

  private cleanContent(value: any) {
    if (typeof value !== 'string') {
      return '';
    }
    const content = value.replace(/^\uFEFF/, '').trim();
    // wangEditor 在空内容时会产出 <p><br></p> 或仅 BOM/换行，统一归一化为空串，
    // 避免前台渲染出一个空的正文区块。
    if (!content || /^<p>(?:\s|<br\s*\/?>)*<\/p>$/i.test(content)) {
      return '';
    }
    return content;
  }

  private async ensureTemplateValid(templateFile: string) {
    if (!TEMPLATE_FILE_RE.test(templateFile)) {
      throw new BusinessException('落地页模板文件不合法');
    }
    const templates = await this.listTemplates();
    if (!templates.some(item => item.value === templateFile)) {
      throw new BusinessException('所选落地页模板不存在！');
    }
  }

  private async findExisting(id: any) {
    const pageId = Number(id);
    if (!Number.isInteger(pageId) || pageId <= 0) {
      throw new BusinessException('落地页不存在！');
    }

    const page = await this.landingPageModel.findOne({
      where: { id: pageId, isDelete: 0 },
    });
    if (!page) {
      throw new BusinessException('落地页不存在！');
    }
    return page;
  }

  private async ensureSlugUnique(slug: string, excludeId?: number) {
    const where: any = { slug, isDelete: 0 };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const existing = await this.landingPageModel.findOne({ where });
    if (existing) {
      throw new BusinessException('访问别名已存在！');
    }
  }

  private toAdminPage(page: LandingPage, withContent = true) {
    const data: any = page.toJSON();
    data.cover = urlUtil.toAbsoluteUrl(data.cover);
    if (!withContent) {
      delete data.content;
    }
    return data;
  }

  private toPublicPage(page: LandingPage) {
    const data: any = page.toJSON();
    return {
      ...data,
      cover: urlUtil.toAbsoluteUrl(data.cover),
      url: `/landing/${data.slug}`,
    };
  }

  private rethrow(err: any, context: string): never {
    if (err instanceof BusinessException) {
      throw err;
    }
    throw new BusinessException(`${context}: ${err}`);
  }
}
