export enum LinkTypeEnum {
    'SHOP_PAGES' = 'shop',
    'CUSTOM_LINK' = 'custom'
}

export interface Link {
    path: string
    name?: string
    type: string
    query?: Record<string, any>
}

// 商城页面「中文名 -> 语言包 key」映射。
// 注意：数据里持久化的是中文名（装修页 JSON 等），这里仅用于展示层翻译
export const shopPagesKeys: Record<string, string> = {
    商城首页: 'components.shopPages.home',
    文章资讯: 'components.shopPages.news',
    个人中心: 'components.shopPages.user',
    我的收藏: 'components.shopPages.collection',
    联系客服: 'components.shopPages.customerService',
    个人设置: 'components.shopPages.userSet',
    关于我们: 'components.shopPages.aboutUs',
    个人资料: 'components.shopPages.userData',
    隐私政策: 'components.shopPages.privacy',
    服务协议: 'components.shopPages.service',
    搜索: 'components.shopPages.search'
}
