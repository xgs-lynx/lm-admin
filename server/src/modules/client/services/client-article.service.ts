import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import moment from 'moment';
import * as util from '../../../common/utils';
import urlUtil from '../../../common/utils/url.util';
import { BusinessException, ValidateException } from '../../../common/exceptions/business.exception';
import { Article } from '../../../models/article.model';
import { ArticleCollect } from '../../../models/article-collect.model';

const MAX_PAGE_SIZE = 50;

@Injectable()
export class ClientArticleService {
  constructor(
    @InjectModel(Article) private readonly articleModel: typeof Article,
    @InjectModel(ArticleCollect) private readonly collectModel: typeof ArticleCollect,
  ) {}

  /** 收藏（幂等）。防重 = 先查后插 + 软删复活 + 唯一索引兜底 */
  async collect(userId: number, body: any) {
    const articleId = parseInt(body?.articleId, 10);
    if (isNaN(articleId) || articleId <= 0) {
      throw new ValidateException('articleId 不正确');
    }

    // 校验文章存在且已上架，否则会出现「收藏了从没上架的文章」
    const article = await this.articleModel.findOne({
      where: { id: articleId, is_delete: 0, is_show: 1 } as any,
      attributes: ['id'],
    });
    if (!article) {
      throw new BusinessException('文章不存在或已下架');
    }

    const now = util.unixNow();
    const row = await this.collectModel.findOne({
      where: { user_id: userId, article_id: articleId } as any,
    });

    if (row) {
      if (row.is_delete === 0) {
        return {}; // 已收藏，幂等
      }
      // 软删复活：一个用户对一篇文章永远只有一行
      await this.collectModel.update(
        { is_delete: 0, delete_time: 0, update_time: now } as any,
        { where: { id: row.id } },
      );
      return {};
    }

    try {
      await this.collectModel.create({
        user_id: userId,
        article_id: articleId,
        is_delete: 0,
        create_time: now,
        update_time: now,
        delete_time: 0,
      } as any);
    } catch (err: any) {
      // 并发双击：唯一索引 uk_user_article 拦下第二条 → 退化为复活
      if (err?.name === 'SequelizeUniqueConstraintError') {
        await this.collectModel.update(
          { is_delete: 0, delete_time: 0, update_time: now } as any,
          { where: { user_id: userId, article_id: articleId } as any },
        );
        return {};
      }
      throw new BusinessException('收藏失败');
    }

    return {};
  }

  /** 取消收藏（幂等）：0 行受影响也算成功 */
  async collectCancel(userId: number, body: any) {
    const articleId = parseInt(body?.articleId, 10);
    if (isNaN(articleId) || articleId <= 0) {
      throw new ValidateException('articleId 不正确');
    }

    const now = util.unixNow();
    await this.collectModel.update(
      { is_delete: 1, delete_time: now, update_time: now } as any,
      { where: { user_id: userId, article_id: articleId, is_delete: 0 } as any },
    );

    return {};
  }

  /** 收藏列表 */
  async collectList(userId: number, query: any) {
    const pageNo = parseInt(query?.pageNo, 10) || 1;
    const pageSize = Math.min(parseInt(query?.pageSize, 10) || 10, MAX_PAGE_SIZE);
    const offset = pageSize * (pageNo - 1);

    const { count, rows } = await this.collectModel.findAndCountAll({
      where: { user_id: userId, is_delete: 0 } as any,
      limit: pageSize,
      offset,
      order: [['id', 'DESC']],
    });

    // 不建 Sequelize association，改为「先查收藏行，再批量 IN 查文章」两次查询
    const articleIds = rows.map(r => r.article_id);
    const articles = articleIds.length
      ? await this.articleModel.findAll({
          where: { id: articleIds } as any,
          attributes: ['id', 'title', 'image', 'intro', 'is_show', 'is_delete'],
        })
      : [];
    const map = new Map<number, any>(articles.map(a => [a.id, a]));

    const lists = rows.map(r => {
      const a: any = map.get(r.article_id);
      const alive = !!a && a.is_delete === 0 && a.is_show === 1;
      return {
        id: r.id,
        articleId: r.article_id,
        title: alive ? a.title : '文章已删除',
        image: alive ? urlUtil.toAbsoluteUrl(a.image) : '',
        intro: alive ? a.intro : '',
        createTime: r.create_time
          ? moment(r.create_time * 1000).format('YYYY-MM-DD HH:mm:ss')
          : '',
      };
    });

    // count 取收藏行数不做过滤：否则文章被删/下架会让 count 与 lists 长度不一致，
    // 前端分页器会出现空页。这类条目按「文章已删除」返回。
    return { pageNo, pageSize, count, lists };
  }
}
