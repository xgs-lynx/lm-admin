<template>
    <div>
        <el-card class="!border-none" shadow="never">
            <el-alert
                type="warning"
                title="温馨提示：每个落地页通过 /landing/{访问别名} 对外展示，仅已发布的页面可访问；站点根路径 / 展示排序最靠前的已发布页面。"
                :closable="false"
                show-icon
            />
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <el-form class="mb-[-16px]" :model="queryParams" :inline="true">
                <el-form-item label="页面名称">
                    <el-input
                        v-model="queryParams.keyword"
                        class="w-[280px]"
                        placeholder="请输入标题或访问别名"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="发布状态">
                    <el-select v-model="queryParams.isShow" class="w-[280px]">
                        <el-option label="全部" value="" />
                        <el-option label="已发布" :value="1" />
                        <el-option label="未发布" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never" v-loading="pager.loading">
            <div>
                <router-link
                    v-if="editRoute"
                    v-perms="['web:landing:add']"
                    :to="{ path: editRoute }"
                >
                    <el-button type="primary" class="mb-4">
                        <template #icon>
                            <icon name="el-icon-Plus" />
                        </template>
                        新增落地页
                    </el-button>
                </router-link>
            </div>

            <el-table size="large" :data="pager.lists">
                <el-table-column label="ID" prop="id" width="80" />
                <el-table-column label="封面" width="110">
                    <template #default="{ row }">
                        <image-contain
                            v-if="row.cover"
                            :src="row.cover"
                            :width="72"
                            :height="48"
                            :preview-src-list="[row.cover]"
                            preview-teleported
                            fit="cover"
                        />
                    </template>
                </el-table-column>
                <el-table-column
                    label="页面标题"
                    prop="title"
                    min-width="180"
                    show-tooltip-when-overflow
                />
                <el-table-column label="访问地址" min-width="180">
                    <template #default="{ row }">
                        <span class="text-tx-secondary">/landing/{{ row.slug }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    label="页面模板"
                    prop="templateFile"
                    min-width="130"
                    show-tooltip-when-overflow
                />
                <el-table-column label="发布状态" width="110">
                    <template #default="{ row }">
                        <el-switch
                            v-perms="['web:landing:change']"
                            v-model="row.isShow"
                            :active-value="1"
                            :inactive-value="0"
                            @change="changeStatus(row)"
                        />
                    </template>
                </el-table-column>
                <el-table-column label="排序" prop="sort" width="90" />
                <el-table-column label="更新时间" prop="updateTime" min-width="170" />
                <el-table-column label="操作" width="190" fixed="right">
                    <template #default="{ row }">
                        <el-button
                            v-if="editRoute"
                            v-perms="['web:landing:edit']"
                            type="primary"
                            link
                        >
                            <router-link
                                :to="{
                                    path: editRoute,
                                    query: {
                                        id: row.id
                                    }
                                }"
                            >
                                编辑
                            </router-link>
                        </el-button>
                        <el-button v-if="row.isShow == 1" type="primary" link>
                            <a :href="getViewUrl(row.slug)" target="_blank" rel="noopener">
                                查看
                            </a>
                        </el-button>
                        <el-button
                            v-perms="['web:landing:del']"
                            type="danger"
                            link
                            @click="handleDelete(row.id)"
                        >
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="flex justify-end mt-4">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="webLanding">
import config from '@/config'
import { landingPageDelete, landingPageLists, landingPageStatus } from '@/api/web'
import { usePaging } from '@/hooks/usePaging'
import { getRoutePath } from '@/router'
import feedback from '@/utils/feedback'

const queryParams = reactive({
    keyword: '',
    isShow: ''
})

const editRoute = getRoutePath('web:landing:edit')

const { pager, getLists, resetPage, resetParams } = usePaging({
    fetchFun: landingPageLists,
    params: queryParams
})

const getViewUrl = (slug: string) => `${config.baseUrl}landing/${slug}`

const changeStatus = async (row: any) => {
    try {
        await landingPageStatus({ id: row.id, isShow: row.isShow })
        feedback.msgSuccess('修改成功')
        getLists()
    } catch (error) {
        getLists()
    }
}

const handleDelete = async (id: number) => {
    await feedback.confirm('确定要删除该落地页？')
    await landingPageDelete({ id })
    feedback.msgSuccess('删除成功')
    getLists()
}

onActivated(() => {
    getLists()
})

getLists()
</script>
