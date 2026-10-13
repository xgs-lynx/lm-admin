import { createI18n } from 'vue-i18n'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import type { Language } from 'element-plus/es/locale'
import cache from '@/utils/cache'
import { LANG_KEY } from '@/enums/cacheEnums'
import zhCnMessages from './lang/zh-cn'
import enMessages from './lang/en'

// 支持的语言
export const SUPPORT_LOCALES = ['zh-cn', 'en'] as const
export type SupportLocale = (typeof SUPPORT_LOCALES)[number]
// 默认语言
export const DEFAULT_LOCALE = 'zh-cn'

// 语言列表（语言名用各自母语书写，不参与翻译）
export const localeList: { label: string; value: SupportLocale }[] = [
    { label: '简体中文', value: 'zh-cn' },
    { label: 'English', value: 'en' }
]

// Element Plus 语言包，配合 el-config-provider 使用
export const elementLocales: Record<string, Language> = {
    'zh-cn': zhCn,
    en
}

export function getLocale(): SupportLocale {
    const locale = cache.get(LANG_KEY)
    return SUPPORT_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE
}

// 注意：选项必须内联传入，否则 legacy 会被推断为 boolean，
// 导致 i18n.global.locale 退化为 string 类型（无法 .value 赋值）
export const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: getLocale(),
    fallbackLocale: DEFAULT_LOCALE,
    messages: {
        'zh-cn': zhCnMessages,
        en: enMessages
    }
})

// 供非 setup 环境（工具函数、指令、路由等）使用
export function t(key: string, ...args: any[]): string {
    return (i18n.global.t as any)(key, ...args)
}

// 切换语言：持久化后整页刷新，
// 保证模块作用域一次性求值的文案（字典映射、组件 props 默认值等）同步更新
export function setLocale(locale: SupportLocale) {
    if (!SUPPORT_LOCALES.includes(locale) || locale === i18n.global.locale.value) {
        return
    }
    i18n.global.locale.value = locale
    cache.set(LANG_KEY, locale)
    window.location.reload()
}

// 同步 html 的 lang 属性
export function setupLocale() {
    document.documentElement.lang = i18n.global.locale.value
}

export default i18n
