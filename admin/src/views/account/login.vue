<template>
    <div class="login flex flex-col relative">
        <div class="absolute top-6 right-6 z-10">
            <lang-select
                class="lang-select rounded-full border border-br bg-body px-3 py-1.5 text-tx-primary shadow-light hover:border-primary hover:text-primary"
            />
        </div>
        <div class="flex-1 flex items-center justify-center">
            <div class="login-card flex rounded-md">
                <div class="flex-1 h-full hidden md:inline-block">
                    <image-contain :src="config.webBackdrop" :width="400" height="100%" />
                </div>
                <div
                    class="login-form bg-body flex flex-col justify-center px-10 py-10 md:w-[400px] w-[375px] flex-none mx-auto"
                >
                    <div class="text-center text-3xl font-medium mb-8">{{ config.webName }}</div>
                    <el-form ref="formRef" :model="formData" size="large" :rules="rules">
                        <el-form-item prop="account">
                            <el-input
                                v-model.trim="formData.account"
                                :placeholder="$t('login.accountPlaceholder')"
                                @keyup.enter="handleEnter"
                            >
                                <template #prepend>
                                    <icon name="el-icon-User" />
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item prop="password">
                            <el-input
                                ref="passwordRef"
                                v-model="formData.password"
                                show-password
                                :placeholder="$t('login.passwordPlaceholder')"
                                @keyup.enter="handleLogin"
                            >
                                <template #prepend>
                                    <icon name="el-icon-Lock" />
                                </template>
                            </el-input>
                        </el-form-item>
                    </el-form>
                    <div class="mb-5">
                        <el-checkbox
                            v-model="remAccount"
                            :label="$t('login.rememberAccount')"
                        ></el-checkbox>
                    </div>
                    <el-button type="primary" size="large" :loading="isLock" @click="lockLogin">
                        {{ $t('login.loginBtn') }}
                    </el-button>
                </div>
            </div>
        </div>
        <layout-footer />
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { InputInstance, FormInstance } from 'element-plus'
import LayoutFooter from '@/layout/components/footer.vue'
import useAppStore from '@/stores/modules/app'
import useUserStore from '@/stores/modules/user'
import cache from '@/utils/cache'
import { ACCOUNT_KEY } from '@/enums/cacheEnums'
import { PageEnum } from '@/enums/pageEnum'
import { useLockFn } from '@/hooks/useLockFn'
const { t } = useI18n()
const passwordRef = shallowRef<InputInstance>()
const formRef = shallowRef<FormInstance>()
const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const remAccount = ref(false)
const config = computed(() => appStore.config)
const formData = reactive({
    account: '',
    password: ''
})
const rules = {
    account: [
        {
            required: true,
            message: t('login.accountPlaceholder'),
            trigger: ['blur']
        }
    ],
    password: [
        {
            required: true,
            message: t('login.passwordPlaceholder'),
            trigger: ['blur']
        }
    ]
}
// 回车按键监听
const handleEnter = () => {
    if (!formData.password) {
        return passwordRef.value?.focus()
    }
    handleLogin()
}
// 登录处理
const handleLogin = async () => {
    await formRef.value?.validate()
    // 记住账号，缓存
    cache.set(ACCOUNT_KEY, {
        remember: remAccount.value,
        account: remAccount.value ? formData.account : ''
    })
    await userStore.login(formData)
    const {
        query: { redirect }
    } = route
    const path = typeof redirect === 'string' ? redirect : PageEnum.INDEX
    router.push(path)
}
const { isLock, lockFn: lockLogin } = useLockFn(handleLogin)

onMounted(() => {
    const value = cache.get(ACCOUNT_KEY)
    if (value?.remember) {
        remAccount.value = value.remember
        formData.account = value.account
    }
})
</script>

<style lang="scss" scoped>
.login {
    background-image: url('./images/login_bg.png');
    @apply min-h-screen bg-no-repeat bg-center bg-cover;
    .login-card {
        height: 400px;
    }
}
</style>
