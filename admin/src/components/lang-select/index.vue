<template>
    <el-dropdown trigger="click" @command="handleCommand">
        <span class="lang-select inline-flex items-center cursor-pointer select-none">
            <icon :size="16" name="local-icon-qiehuan" />
            <span class="ml-1 text-sm">{{ currentLabel }}</span>
        </span>
        <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item
                    v-for="item in localeList"
                    :key="item.value"
                    :command="item.value"
                    :disabled="item.value === locale"
                >
                    {{ item.label }}
                </el-dropdown-item>
            </el-dropdown-menu>
        </template>
    </el-dropdown>
</template>

<script lang="ts" setup>
import { i18n, localeList, setLocale, type SupportLocale } from '@/locales'

const locale = computed(() => i18n.global.locale.value as SupportLocale)
const currentLabel = computed(
    () => localeList.find((item) => item.value === locale.value)?.label ?? ''
)
const handleCommand = (command: SupportLocale) => {
    setLocale(command)
}
</script>
