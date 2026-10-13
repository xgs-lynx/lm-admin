<template>
    <div class="custom-link mt-[30px]">
        <div class="flex flex-wrap items-center">
            {{ $t('components.link.customLink') }}
            <div class="ml-4 flex-1 min-w-[100px]">
                <el-input
                    :model-value="modelValue.query?.url"
                    :placeholder="$t('components.link.customPlaceholder')"
                    @input="handleInput"
                />
            </div>
        </div>
        <div class="form-tips">
            {{ $t('components.link.customTips') }}
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import { LinkTypeEnum, type Link } from '.'

defineProps({
    modelValue: {
        type: Object as PropType<Link>,
        default: () => ({})
    }
})
const emit = defineEmits<{
    (event: 'update:modelValue', value: Link): void
}>()

const handleInput = (value: string) => {
    emit('update:modelValue', {
        path: '/pages/webview/webview',
        query: {
            url: value
        },
        type: LinkTypeEnum.CUSTOM_LINK
    })
}
</script>
