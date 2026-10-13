/**
 * perm 操作权限处理
 * 指令用法：
 *  <el-button v-perms="['auth.menu/edit']">编辑</el-button>
 */

import feedback from '@/utils/feedback'
import { t } from '@/locales'
import useClipboard from 'vue-clipboard3'
const clipboard = 'data-clipboard-text'
export default {
    mounted: (el: HTMLElement, binding: any) => {
        el.setAttribute(clipboard, binding.value)
        const { toClipboard } = useClipboard()

        el.onclick = () => {
            toClipboard(el.getAttribute(clipboard)!)
                .then(() => {
                    feedback.msgSuccess(t('common.copySuccess'))
                })
                .catch(() => {
                    feedback.msgError(t('common.copyFail'))
                })
        }
    },
    updated: (el: HTMLElement, binding: any) => {
        el.setAttribute(clipboard, binding.value)
    }
}
