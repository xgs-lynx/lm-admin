<!-- 系统日志 -->
<template>
    <div class="journal">
        <el-card class="!border-none" shadow="never">
            <el-tabs v-model="activeTab" @tab-change="handleTabChange">
                <el-tab-pane label="操作日志" name="operate" lazy>
                    <el-form class="ls-form" :model="formData" inline>
                        <el-form-item label="管理员">
                            <el-input
                                class="w-[280px]"
                                placeholder="请输入"
                                v-model="formData.username"
                                clearable
                                @keyup.enter="resetPage"
                            />
                        </el-form-item>

                        <el-form-item label="访问方式">
                            <el-select
                                class="w-[280px]"
                                v-model="formData.type"
                                placeholder="请选择"
                            >
                                <el-option
                                    v-for="(item, index) in visitType"
                                    :key="index"
                                    :label="item.label"
                                    :value="item.value"
                                />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="来源IP">
                            <el-input
                                class="w-[280px]"
                                placeholder="请输入"
                                v-model="formData.ip"
                                clearable
                                @keyup.enter="resetPage"
                            />
                        </el-form-item>

                        <el-form-item label="访问时间">
                            <daterange-picker
                                v-model:startTime="formData.startTime"
                                v-model:endTime="formData.endTime"
                            />
                        </el-form-item>

                        <el-form-item label="访问链接">
                            <el-input
                                class="w-[280px]"
                                placeholder="请输入"
                                v-model="formData.url"
                                clearable
                                @keyup.enter="resetPage"
                            />
                        </el-form-item>

                        <el-form-item>
                            <el-button type="primary" @click="resetPage">查询</el-button>
                            <el-button @click="resetParams">重置</el-button>
                        </el-form-item>
                    </el-form>

                    <el-table :data="pager.lists" size="large" v-loading="pager.loading">
                        <el-table-column label="记录ID" prop="id" />
                        <el-table-column label="操作" prop="title" min-width="120" />
                        <el-table-column label="管理员" prop="username" min-width="120" />
                        <el-table-column label="访问链接" prop="url" min-width="160" />
                        <el-table-column label="访问方式" prop="type" min-width="100" />
                        <el-table-column label="来源IP" prop="ip" min-width="160" />
                        <el-table-column label="错误信息" prop="error" min-width="160" />
                        <el-table-column
                            label="执行耗时(毫秒)"
                            prop="taskTime"
                            min-width="100"
                        />
                        <el-table-column label="日志时间" prop="createTime" min-width="180" />
                    </el-table>
                    <div class="flex mt-4 justify-end">
                        <pagination v-model="pager" @change="getLists" />
                    </div>
                </el-tab-pane>

                <el-tab-pane label="登录日志" name="login" lazy>
                    <el-form class="ls-form" :model="loginFormData" inline>
                        <el-form-item label="登录账号">
                            <el-input
                                class="w-[280px]"
                                placeholder="请输入"
                                v-model="loginFormData.username"
                                clearable
                                @keyup.enter="resetLoginPage"
                            />
                        </el-form-item>

                        <el-form-item label="登录状态">
                            <el-select
                                class="w-[280px]"
                                v-model="loginFormData.status"
                                placeholder="请选择"
                            >
                                <el-option
                                    v-for="(item, index) in loginStatus"
                                    :key="index"
                                    :label="item.label"
                                    :value="item.value"
                                />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="来源IP">
                            <el-input
                                class="w-[280px]"
                                placeholder="请输入"
                                v-model="loginFormData.ip"
                                clearable
                                @keyup.enter="resetLoginPage"
                            />
                        </el-form-item>

                        <el-form-item label="登录时间">
                            <daterange-picker
                                v-model:startTime="loginFormData.startTime"
                                v-model:endTime="loginFormData.endTime"
                            />
                        </el-form-item>

                        <el-form-item>
                            <el-button type="primary" @click="resetLoginPage">查询</el-button>
                            <el-button @click="resetLoginParams">重置</el-button>
                        </el-form-item>
                    </el-form>

                    <el-table
                        :data="loginPager.lists"
                        size="large"
                        v-loading="loginPager.loading"
                    >
                        <el-table-column label="记录ID" prop="id" />
                        <el-table-column label="登录账号" prop="username" min-width="120" />
                        <el-table-column label="来源IP" prop="ip" min-width="160" />
                        <el-table-column label="操作系统" prop="os" min-width="140" />
                        <el-table-column label="浏览器" prop="browser" min-width="160" />
                        <el-table-column label="登录状态" min-width="100">
                            <template #default="{ row }">
                                <el-tag v-if="row.status == 1">成功</el-tag>
                                <el-tag type="danger" v-else>失败</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="登录时间" prop="createTime" min-width="180" />
                    </el-table>
                    <div class="flex mt-4 justify-end">
                        <pagination v-model="loginPager" @change="getLoginLists" />
                    </div>
                </el-tab-pane>
            </el-tabs>
        </el-card>
    </div>
</template>

<script setup lang="ts" name="journal">
import { systemLogLists, systemLogLoginLists } from "@/api/setting/system";
import { usePaging } from "@/hooks/usePaging";

// 当前标签页
const activeTab = ref("operate");

// ==================== 操作日志 ====================
// 查询表单
const formData = ref({
  username: "",
  url: "",
  ip: "",
  type: "",
  startTime: "",
  endTime: "",
});

// 访问方式
const visitType = ref<Array<any>>([
  {
    label: "全部",
    value: "",
  },
  {
    label: "get",
    value: "GET",
  },
  {
    label: "post",
    value: "POST",
  },
]);

const { pager, getLists, resetParams, resetPage } = usePaging({
  fetchFun: systemLogLists,
  params: formData.value,
});

// ==================== 登录日志 ====================
// 查询表单：必须是独立于 formData 的另一个对象。
// usePaging 会对 params 做快照，且 resetParams 会回写传入的这个对象，
// 两个 tab 共用同一个对象会导致重置互相串改。
const loginFormData = ref({
  username: "",
  ip: "",
  status: "",
  startTime: "",
  endTime: "",
});

// 登录状态：后端实际写入 1=成功、0=失败（模型注释里的 2 是错的，从不出现）
const loginStatus = ref<Array<any>>([
  {
    label: "全部",
    value: "",
  },
  {
    label: "成功",
    value: 1,
  },
  {
    label: "失败",
    value: 0,
  },
]);

const {
  pager: loginPager,
  getLists: getLoginLists,
  resetParams: resetLoginParams,
  resetPage: resetLoginPage,
} = usePaging({
  fetchFun: systemLogLoginLists,
  params: loginFormData.value,
});

// 切 tab 时按当前 tab 拉取。两个 pager 各自独立，不调 resetPage 以避免
// 丢失用户在另一个 tab 的页码位置；首次切入时该 pager 的页码本就是 1。
const handleTabChange = (name: any) => {
  if (name === "login") {
    getLoginLists();
  } else {
    getLists();
  }
};

// 首屏只加载默认展示的操作日志，登录日志延后到首次切换标签时再请求
getLists();
</script>

<style lang="scss" scoped></style>
