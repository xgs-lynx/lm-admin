import 'vue-i18n'
import type { ComposerTranslation } from 'vue-i18n'

// globalInjection 注入到模板的 $t 类型。
// vue-i18n 9.14 自带的 declare module 'vue' 声明在当前 vue-tsc 0.38 / vue 3.4 组合下不生效，
// 这里按 Vue 官方文档的方式扩展 @vue/runtime-core
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $t: ComposerTranslation
    }
}
