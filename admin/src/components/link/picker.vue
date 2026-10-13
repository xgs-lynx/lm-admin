<template>
    <div class="link-picker flex-1" @click="!disabled && popupRef?.open()">
        <el-input
            :model-value="getLink"
            :placeholder="$t('components.link.selectPlaceholder')"
            readonly
            :disabled="disabled"
        >
            <template #suffix>
                <icon v-if="!modelValue?.path" name="el-icon-ArrowRight" />
                <icon
                    v-else
                    name="el-icon-Close"
                    @click.stop="!disabled && emit('update:modelValue', {})"
                />
            </template>
        </el-input>
        <popup
            ref="popupRef"
            width="700px"
            :title="$t('components.link.pickerTitle')"
            @confirm="handleConfirm"
        >
            <link-content v-model="activeLink" />
        </popup>
    </div>
</template>

<script lang="ts" setup>
import { LinkTypeEnum, shopPagesKeys, type Link } from '.'
import LinkContent from './index.vue'
import Popup from '@/components/popup/index.vue'
const { t } = useI18n()
const props = defineProps({
    modelValue: {
        type: Object
    },
    disabled: {
        type: Boolean,
        default: false
    }
})
const emit = defineEmits<{
    (event: 'update:modelValue', value: any): void
}>()

const popupRef = shallowRef<InstanceType<typeof Popup>>()
const activeLink = ref<Link>({ path: '', type: LinkTypeEnum.SHOP_PAGES })
const handleConfirm = () => {
    emit('update:modelValue', activeLink.value)
}

// 商城页面仅翻译展示，数据里存的仍是中文名
const getLabel = (name?: string) => {
    const key = name ? shopPagesKeys[name] : ''
    return key ? t(key) : name
}

const getLink = computed(() => {
    switch (props.modelValue?.type) {
        case LinkTypeEnum.SHOP_PAGES:
            return getLabel(props.modelValue.name)
        case LinkTypeEnum.CUSTOM_LINK:
            return props.modelValue.query?.url
        default:
            return props.modelValue?.name
    }
})
watch(
    () => props.modelValue,
    (value) => {
        if (value?.type) {
            activeLink.value = value as Link
        }
    },
    {
        immediate: true
    }
)
</script>

<style scoped lang="scss">
.link-picker {
    :deep(.el-input) {
        &.is-disabled {
            .el-input__inner {
                cursor: not-allowed;
            }
            .el-input__suffix {
                cursor: not-allowed;
            }
        }
        .el-input__inner {
            cursor: pointer;
        }
        .el-input__suffix {
            cursor: pointer;
        }
    }
}
</style>
