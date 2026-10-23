import { All, Controller, Get, NotFoundException, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import config from '../../common/config';
import urlUtil from '../../common/utils/url.util';
import { CommonService } from '../system/services/common.service';
import { LandingService } from './services/landing.service';

const SEO_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const NOINDEX_ROBOTS = 'noindex, nofollow';

@Controller()
export class LandingWebController {
  constructor(
    private readonly landing: LandingService,
    private readonly common: CommonService,
  ) {}

  @Get()
  async index(@Res() res: Response) {
    const page = await this.landing.findDefaultPublished();
    const viewData = await this.buildSiteData();
    if (!page) {
      res.render('landing/empty', {
        ...viewData,
        title: this.withSiteName('页面建设中', viewData.site.webName),
        metaDescription: '',
        metaKeywords: '',
        canonical: '',
        ogImage: '',
        robots: NOINDEX_ROBOTS,
        structuredData: '',
      });
      return;
    }

    this.renderPage(res, page, viewData);
  }

  @Get('landing/:slug')
  async show(@Param('slug') slug: string, @Res() res: Response) {
    const page = await this.landing.findPublishedBySlug(slug);
    if (!page) {
      await this.renderNotFound(res);
      return;
    }

    const viewData = await this.buildSiteData();
    this.renderPage(res, page, viewData);
  }

  @Get('sitemap.xml')
  async sitemap(@Res() res: Response) {
    const pages = await this.landing.findAllPublished();
    const base = this.publicBase();
    const latest = pages[0]?.updateTime || '';
    const urls: Array<{
      loc: string;
      lastmod: string;
      changefreq: string;
      priority: string;
    }> = [];

    if (base && pages.length) {
      urls.push({
        loc: `${base}/`,
        lastmod: this.lastmod(latest),
        changefreq: 'daily',
        priority: '1.0',
      });
    }
    for (const page of pages) {
      urls.push({
        loc: `${base}/landing/${page.slug}`,
        lastmod: this.lastmod(page.updateTime),
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    const entries = urls
      .map(url =>
        [
          '  <url>',
          `    <loc>${this.escapeXml(url.loc)}</loc>`,
          url.lastmod ? `    <lastmod>${this.escapeXml(url.lastmod)}</lastmod>` : '',
          `    <changefreq>${url.changefreq}</changefreq>`,
          `    <priority>${url.priority}</priority>`,
          '  </url>',
        ]
          .filter(Boolean)
          .join('\n'),
      )
      .join('\n');

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      entries,
      '</urlset>',
      '',
    ].join('\n');

    res.setHeader('Cache-Control', 'public, max-age=300');
    res.type('application/xml').send(xml);
  }

  @Get('robots.txt')
  robots(@Res() res: Response) {
    const base = this.publicBase();
    const sitemap = base ? `${base}/sitemap.xml` : '/sitemap.xml';
    const content = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      '',
      `Sitemap: ${sitemap}`,
      '',
    ].join('\n');

    res.setHeader('Cache-Control', 'public, max-age=300');
    res.type('text/plain').send(content);
  }

  // 兜底：非 /api 的未匹配路由统一渲染 HTML 404；/api 下保持原有 JSON 404 行为。
  // 该路由必须定义在所有具体 Web 路由之后，依赖 Nest 按声明顺序注册路由。
  @All('*')
  async notFound(@Req() req: Request, @Res() res: Response) {
    const pathname = String(req.path || req.originalUrl || '').split('?')[0];
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      throw new NotFoundException(`Cannot ${req.method} ${pathname}`);
    }

    await this.renderNotFound(res);
  }

  private async renderNotFound(res: Response) {
    const viewData = await this.buildSiteData();
    res.status(404).render('error/404', {
      ...viewData,
      title: this.withSiteName('页面不存在', viewData.site.webName),
      metaDescription: '',
      metaKeywords: '',
      canonical: '',
      ogImage: '',
      robots: NOINDEX_ROBOTS,
      structuredData: '',
    });
  }

  private renderPage(res: Response, page: any, viewData: any) {
    const base = this.publicBase();
    const canonical = base ? `${base}${page.url}` : page.url;
    const title = page.seoTitle || this.withSiteName(page.title, viewData.site.webName);
    const metaDescription = page.seoDescription || page.subtitle || this.plainText(page.content);

    res.render('landing/show', {
      ...viewData,
      title,
      metaDescription,
      metaKeywords: page.seoKeywords || '',
      canonical,
      ogImage: page.cover || '',
      robots: SEO_ROBOTS,
      structuredData: this.buildStructuredData(page, viewData, canonical, metaDescription),
      page: {
        ...page,
        ctaExternal: /^https?:\/\//i.test(page.ctaLink || ''),
      },
    });
  }

  private buildStructuredData(page: any, viewData: any, canonical: string, description: string) {
    const base = this.publicBase();
    const siteUrl = base ? `${base}/` : '/';
    const siteName = viewData.site.webName || page.title;
    const graph: any[] = [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        url: siteUrl,
        name: siteName,
        inLanguage: 'zh-CN',
      },
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: page.title,
        headline: page.title,
        description,
        isPartOf: { '@id': `${siteUrl}#website` },
        inLanguage: 'zh-CN',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: siteUrl },
          {
            '@type': 'ListItem',
            position: 2,
            name: page.title,
            item: canonical,
          },
        ],
      },
    ];

    const webPage = graph[1];
    if (page.cover) {
      webPage.image = page.cover;
    }
    if (page.createTime) {
      webPage.datePublished = this.toIsoDate(page.createTime);
    }
    if (page.updateTime) {
      webPage.dateModified = this.toIsoDate(page.updateTime);
    }

    return this.safeJson({ '@context': 'https://schema.org', '@graph': graph });
  }

  private async buildSiteData() {
    // 公开展示页使用「前台设置」里的商城名称/Logo；未配置时回退到后台站点信息。
    const [siteConfig, website] = await Promise.all([
      this.common.getConfig(),
      this.common.get('website'),
    ]);
    return {
      site: {
        ...siteConfig,
        webName: website.shopName || siteConfig.webName,
        webLogo: urlUtil.toAbsoluteUrl(website.shopLogo || website.logo),
      },
      year: new Date().getFullYear(),
    };
  }

  private publicBase() {
    return String(config.publicUrl || '').replace(/\/+$/, '');
  }

  private withSiteName(title: string, siteName?: string) {
    return siteName ? `${title} - ${siteName}` : title;
  }

  private plainText(html: string, maxLength = 160) {
    const text = String(html || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  }

  private toIsoDate(value: any) {
    return value ? `${String(value).replace(' ', 'T')}+08:00` : undefined;
  }

  private lastmod(value: any) {
    return value ? String(value).slice(0, 10) : '';
  }

  private escapeXml(value: any) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private safeJson(value: any) {
    return JSON.stringify(value)
      .replace(/</g, '\\u003c')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
  }
}
