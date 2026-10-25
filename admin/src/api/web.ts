import request from '@/utils/request'

// 落地页列表
export function landingPageLists(params?: any) {
    return request.get({ url: '/web/landing/list', params })
}

// 落地页模板文件列表
export function landingPageTemplates() {
    return request.get({ url: '/web/landing/templates' })
}

// 落地页详情
export function landingPageDetail(params: any) {
    return request.get({ url: '/web/landing/detail', params }, { ignoreCancelToken: true })
}

// 新增落地页
export function landingPageAdd(params: any) {
    return request.post({ url: '/web/landing/add', params })
}

// 编辑落地页
export function landingPageEdit(params: any) {
    return request.post({ url: '/web/landing/edit', params })
}

// 删除落地页
export function landingPageDelete(params: any) {
    return request.post({ url: '/web/landing/del', params })
}

// 修改落地页状态
export function landingPageStatus(params: any) {
    return request.post({ url: '/web/landing/change', params })
}
