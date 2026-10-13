<template>
    <el-dropdown class="px-2" @command="handleCommand">
        <div class="flex items-center">
            <el-avatar :size="34" :src="userInfo.avatar" />
            <div class="ml-3 mr-1">{{ userInfo.nickname }}</div>
            <icon name="el-icon-ArrowDown" />
        </div>

        <template #dropdown>
            <el-dropdown-menu>
                <router-link to="/user/setting">
                    <el-dropdown-item>{{ $t('layout.user.setting') }}</el-dropdown-item>
                </router-link>
                <el-dropdown-item command="logout">
                    {{ $t('layout.user.logout') }}
                </el-dropdown-item>
                <el-dropdown-item divided disabled>
                    {{ $t('layout.user.language') }}
                </el-dropdown-item>
                <el-dropdown-item
                    v-for="item in localeList"
                    :key="item.value"
                    :command="`lang:${item.value}`"
                    :disabled="item.value === locale"
                >
                    {{ item.label }}
                </el-dropdown-item>
            </el-dropdown-menu>
        </template>
    </el-dropdown>
</template>

<script setup lang="ts">
import useUserStore from '@/stores/modules/user'
import feedback from '@/utils/feedback'
import { i18n, localeList, setLocale, type SupportLocale } from '@/locales'
const userStore = useUserStore()
const { t } = useI18n()

const userInfo = computed(() => userStore.userInfo)
const locale = computed(() => i18n.global.locale.value as SupportLocale)

const handleCommand = async (command: string) => {
    if (command.startsWith('lang:')) {
        setLocale(command.slice(5) as SupportLocale)
        return
    }
    switch (command) {
        case 'logout':
            await feedback.confirm(t('layout.user.logoutConfirm'))
            userStore.logout()
    }
}
</script>
