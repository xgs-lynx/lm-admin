<template>
    <div class="landing-edit">
        <el-card class="!border-none" shadow="never">
            <el-page-header :content="pageTitle" @back="goBack" />
        </el-card>

        <el-form ref="formRef" :model="formData" :rules="rules" label-width="110px">
            <el-card class="!border-none mt-4" shadow="never">
                <div class="text-xl font-medium mb-[20px]">基础信息</div>
                <div class="grid grid-cols-1 gap-x-12 xl:grid-cols-2">
                    <el-form-item label="页面标题" prop="title">
                        <el-input
                            v-model="formData.title"
                            class="w-full"
                            placeholder="请输入页面标题"
                            maxlength="200"
                            show-word-limit
                            clearable
                        />
                    </el-form-item>
                    <el-form-item label="访问别名" prop="slug">
                        <div class="w-full">
                            <el-input
                                v-model="formData.slug"
                                placeholder="例如：about-us"
                                maxlength="100"
                                clearable
                            >
                                <template #prepend>/landing/</template>
                            </el-input>
                            <div class="form-tips">
                                仅支持小写字母、数字和中划线，保存后可通过该地址访问页面
                            </div>
                        </div>
                    </el-form-item>
                    <el-form-item label="副标题" prop="subtitle" class="xl:col-span-2">
                        <el-input
                            v-model="formData.subtitle"
                            type="textarea"
                            :autosize="{ minRows: 2, maxRows: 4 }"
                            placeholder="用于展示在标题下方的介绍文字"
                            maxlength="300"
                            show-word-limit
                        />
                    </el-form-item>
                    <el-form-item label="封面图" prop="cover">
                        <div>
                            <material-picker v-model="formData.cover" :limit="1" />
                            <div class="form-tips">建议尺寸：1200*900px，用于页面首屏展示</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="排序" prop="sort">
                        <div>
                            <el-input-number v-model="formData.sort" :min="0" :max="9999" />
                            <div class="form-tips">数值越大越靠前，站点首页展示排序最高的页面</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="按钮文案" prop="ctaText">
                        <el-input
                            v-model="formData.ctaText"
                            class="w-full"
                            placeholder="例如：立即咨询"
                            maxlength="100"
                            clearable
                        />
                    </el-form-item>
                    <el-form-item label="按钮链接" prop="ctaLink">
                        <el-input
                            v-model="formData.ctaLink"
                            class="w-full"
                            placeholder="https://example.com 或 /landing/other"
                            maxlength="500"
                            clearable
                        />
                    </el-form-item>
                    <el-form-item label="发布状态" prop="isShow">
                        <el-radio-group v-model="formData.isShow">
                            <el-radio :label="1">发布</el-radio>
                            <el-radio :label="0">草稿</el-radio>
                        </el-radio-group>
                    </el-form-item>
                </div>
            </el-card>

            <el-card class="!border-none mt-4" shadow="never">
                <div class="text-xl font-medium mb-[20px]">页面内容</div>
                <el-form-item label="富文本内容" prop="content">
                    <editor v-model="formData.content" height="560" width="100%" />
                </el-form-item>
            </el-card>

            <el-card class="!border-none mt-4" shadow="never">
                <div class="text-xl font-medium mb-[20px]">SEO 设置</div>
                <div class="grid grid-cols-1 gap-x-12 xl:grid-cols-2">
                    <el-form-item label="SEO 标题" prop="seoTitle">
                        <div class="w-full">
                            <el-input
                                v-model="formData.seoTitle"
                                placeholder="不填写时使用页面标题"
                                maxlength="200"
                                show-word-limit
                                clearable
                            />
                            <div class="form-tips">建议不超过 60 个字符</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="SEO 关键词" prop="seoKeywords">
                        <div class="w-full">
                            <el-input
                                v-model="formData.seoKeywords"
                                placeholder="多个关键词用英文逗号分隔"
                                maxlength="255"
                                clearable
                            />
                            <div class="form-tips">多个关键词使用英文逗号分隔</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="SEO 描述" prop="seoDescription" class="xl:col-span-2">
                        <div class="w-full">
                            <el-input
                                v-model="formData.seoDescription"
                                type="textarea"
                                :autosize="{ minRows: 3, maxRows: 5 }"
                                placeholder="不填写时使用副标题或正文摘要"
                                maxlength="500"
                                show-word-limit
                            />
                            <div class="form-tips">建议不超过 160 个字符</div>
                        </div>
                    </el-form-item>
                    <div class="xl:col-span-2">
                        <div class="form-tips mb-2">搜索引擎结果预览</div>
                        <div class="seo-preview">
                            <div class="seo-preview__url">{{ seoPreview.url }}</div>
                            <div class="seo-preview__title">{{ seoPreview.title }}</div>
                            <p class="seo-preview__desc">{{ seoPreview.description }}</p>
                        </div>
                    </div>
                </div>
            </el-card>
        </el-form>

        <footer-btns>
            <el-button
                v-if="isEdit"
                v-perms="['web:landing:edit']"
                type="primary"
                @click="handleSave"
            >
                保存
            </el-button>
            <el-button v-else v-perms="['web:landing:add']" type="primary" @click="handleSave">
                保存
            </el-button>
        </footer-btns>
    </div>
</template>

<script lang="ts" setup name="webLandingEdit">
import type { FormInstance } from 'element-plus'
import config from '@/config'
import { landingPageAdd, landingPageDetail, landingPageEdit } from '@/api/web'
import { getRoutePath } from '@/router'
import useMultipleTabs from '@/hooks/useMultipleTabs'
import feedback from '@/utils/feedback'

const route = useRoute()
const router = useRouter()
const { removeTab } = useMultipleTabs()
const formRef = shallowRef<FormInstance>()
const isEdit = computed(() => !!route.query.id)
const pageTitle = computed(() => (isEdit.value ? '编辑落地页' : '新增落地页'))
const listPath = getRoutePath('web:landing:list') || '/web/landing'
const goBack = async () => {
    const fullPath = route.fullPath
    await router.push(listPath)
    removeTab(fullPath)
}

const formData = reactive({
    id: '',
    title: '',
    slug: '',
    subtitle: '',
    cover: '',
    ctaText: '',
    ctaLink: '',
    content: '',
    seoTitle: '',
    seoKeywords: '',
    seoDescription: '',
    sort: 0,
    isShow: 1
})

const seoPreview = computed(() => ({
    url: `${config.baseUrl}landing/${formData.slug || 'your-page'}`,
    title: formData.seoTitle || formData.title || '页面标题',
    description:
        formData.seoDescription ||
        formData.subtitle ||
        '页面描述会展示在这里，帮助用户了解页面内容。'
}))

const validateCtaLink = (_rule: any, value: string, callback: (error?: Error) => void) => {
    if (!value || /^https?:\/\//i.test(value) || value.startsWith('/')) {
        callback()
        return
    }
    callback(new Error('按钮链接仅支持 http(s):// 或 / 开头的地址'))
}

const rules = {
    title: [{ required: true, message: '请输入页面标题', trigger: ['blur'] }],
    slug: [
        { required: true, message: '请输入访问别名', trigger: ['blur'] },
        {
            pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            message: '访问别名只能包含小写字母、数字和中划线',
            trigger: ['blur']
        }
    ],
    ctaLink: [{ validator: validateCtaLink, trigger: ['blur'] }]
}

const getDetails = async () => {
    const data = await landingPageDetail({
        id: route.query.id
    })
    Object.keys(formData).forEach((key) => {
        const value = data[key]
        if (value !== undefined && value !== null) {
            // @ts-ignore
            formData[key] = value
        }
    })
}

const handleSave = async () => {
    await formRef.value?.validate()
    if (isEdit.value) {
        await landingPageEdit(formData)
    } else {
        await landingPageAdd(formData)
    }
    feedback.msgSuccess('操作成功')
    await goBack()
}

route.query.id && getDetails()
</script>

<style lang="scss" scoped>
.seo-preview {
    max-width: 700px;
    padding: 18px 20px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: var(--el-fill-color-lighter);
    overflow-wrap: anywhere;
}

.seo-preview__url {
    color: #006621;
    font-size: 13px;
    line-height: 1.5;
}

.seo-preview__title {
    margin-top: 4px;
    color: #1a0dab;
    font-size: 18px;
    line-height: 1.4;
}

.seo-preview__desc {
    display: -webkit-box;
    margin: 6px 0 0;
    overflow: hidden;
    color: #4d5156;
    font-size: 13px;
    line-height: 1.6;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}
</style>
