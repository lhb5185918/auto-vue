<template>
    <Home>
        <PageContainer :title="`${projectName || '未知项目'} - 测试用例管理`">
            <el-card shadow="hover" class="table-card">
                <!-- 搜索和操作栏 -->
                <div class="table-header">
                    <!-- 左侧搜索区域 -->
                    <div class="search-bar">
                        <el-input
                            v-model="searchKeyword"
                            placeholder="搜索用例标题或接口路径"
                            prefix-icon="Search"
                            clearable
                            @clear="handleSearch"
                            @input="handleSearch"
                            class="search-input"
                        />
                        <el-select
                            v-model="statusFilter"
                            placeholder="状态筛选"
                            clearable
                            @change="handleSearch"
                            class="filter-select"
                        >
                            <el-option label="未执行" value="未执行" />
                            <el-option label="通过" value="通过" />
                            <el-option label="失败" value="失败" />
                        </el-select>
                        <el-select
                            v-model="priorityFilter"
                            placeholder="优先级筛选"
                            clearable
                            @change="handleSearch"
                            class="filter-select"
                        >
                            <el-option label="高" value="高" />
                            <el-option label="中" value="中" />
                            <el-option label="低" value="低" />
                        </el-select>
                    </div>
                    
                    <!-- 右侧操作按钮 -->
                    <div class="table-operations">
                        <el-button 
                            type="primary" 
                            @click="handleCreateTestCase"
                            :icon="Plus"
                            class="create-button"
                        >
                            新建接口测试用例
                        </el-button>
                    </div>
                </div>

                <!-- 表格部分保持不变 -->
                <el-empty
                    v-if="testCases.length === 0"
                    description="暂无测试用例"
                    :image-size="200"
                >
                    <el-button type="primary" @click="handleCreateTestCase">
                        <el-icon><Plus /></el-icon>新建接口测试用例
                    </el-button>
                </el-empty>

                <el-table 
                    v-else
                    :data="testCases" 
                    border 
                    style="width: 100%" 
                    v-loading="loading"
                    :header-cell-style="{
                        background: '#f5f7fa',
                        color: '#606266',
                        fontWeight: 600
                    }"
                    row-key="case_id"
                    highlight-current-row
                >
                    <el-table-column prop="case_id" label="ID" width="80" align="center" />
                    <el-table-column prop="title" label="用例标题" min-width="180">
                        <template #default="{ row }">
                            <div class="case-title">
                                <span class="title-text">{{ row.title }}</span>
                                <el-tag 
                                    size="small" 
                                    :type="getPriorityType(row.priority)"
                                    effect="plain"
                                    class="priority-tag"
                                >
                                    {{ row.priority }}
                                </el-tag>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="api_path" label="接口路径" min-width="200">
                        <template #default="{ row }">
                            <div class="api-info">
                                <el-tag 
                                    :type="getMethodType(row.method)" 
                                    size="small" 
                                    class="method-tag"
                                >
                                    {{ row.method }}
                                </el-tag>
                                <span class="api-path">{{ row.api_path }}</span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="状态" width="100" align="center">
                        <template #default="{ row }">
                            <el-tag 
                                :type="getStatusType(row.status)"
                                effect="light"
                                size="small"
                                class="status-tag"
                            >
                                {{ row.status }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="create_time" label="创建时间" width="160" align="center">
                        <template #default="{ row }">
                            <div class="time-info">
                                <el-icon><Timer /></el-icon>
                                <span>{{ formatDate(row.create_time) }}</span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200" fixed="right" align="center">
                        <template #default="{ row }">
                            <div class="action-buttons">
                                <el-tooltip content="执行测试" placement="top">
                                    <el-button 
                                        type="success" 
                                        :icon="VideoPlay"
                                        circle 
                                        @click="runTestCase(row)"
                                    />
                                </el-tooltip>
                                <el-tooltip content="编辑用例" placement="top">
                                    <el-button 
                                        type="primary" 
                                        :icon="Edit"
                                        circle 
                                        @click="editTestCase(row)"
                                    />
                                </el-tooltip>
                                <el-tooltip content="删除用例" placement="top">
                                    <el-button 
                                        type="danger" 
                                        :icon="Delete"
                                        circle 
                                        @click="deleteTestCase(row)"
                                    />
                                </el-tooltip>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>

                <!-- 分页器样式优化 -->
                <div class="pagination-container">
                    <el-pagination
                        v-model:current-page="currentPage"
                        v-model:page-size="pageSize"
                        :total="total"
                        :page-sizes="[10, 20, 50, 100]"
                        background
                        layout="total, sizes, prev, pager, next, jumper"
                        @size-change="handleSizeChange"
                        @current-change="handleCurrentChange"
                    />
                </div>
            </el-card>

            <!-- 新建/编辑测试用例对话框 -->
            <el-dialog
                :title="dialogTitle"
                v-model="showAddDialog"
                width="80%"
                :close-on-click-modal="false"
                @closed="resetForm"
                class="test-case-dialog"
            >
                <el-form :model="testCaseForm" :rules="rules" ref="testCaseFormRef" label-width="0">
                    <div class="request-header">
                        <el-form-item prop="method" class="method-select">
                            <el-select v-model="testCaseForm.method" class="method-select">
                                <el-option label="GET" value="GET" />
                                <el-option label="POST" value="POST" />
                                <el-option label="PUT" value="PUT" />
                                <el-option label="DELETE" value="DELETE" />
                                <el-option label="PATCH" value="PATCH" />
                            </el-select>
                        </el-form-item>
                        <el-form-item prop="api_path" class="api-input">
                            <el-input v-model="testCaseForm.api_path" placeholder="请输入接口路径，例如：/api/users" />
                        </el-form-item>
                        <el-button type="primary" @click="submitTestCase">发送</el-button>
                    </div>

                    <el-tabs type="border-card" class="request-tabs">
                        <el-tab-pane label="Headers">
                            <el-form-item prop="headers">
                                <el-input
                                    v-model="testCaseForm.headers"
                                    type="textarea"
                                    rows="5"
                                    placeholder="请输入请求头（JSON格式）"
                                />
                            </el-form-item>
                        </el-tab-pane>
                        <el-tab-pane label="Body">
                            <el-form-item prop="body">
                                <el-input
                                    v-model="testCaseForm.body"
                                    type="textarea"
                                    rows="5"
                                    placeholder="请输入请求体（JSON格式）"
                                />
                            </el-form-item>
                        </el-tab-pane>
                        <el-tab-pane label="Params">
                            <el-form-item prop="params">
                                <el-input
                                    v-model="testCaseForm.params"
                                    type="textarea"
                                    rows="5"
                                    placeholder="请输入请求参数（JSON格式）"
                                />
                            </el-form-item>
                        </el-tab-pane>
                        <el-tab-pane label="Tests">
                            <el-form-item prop="assertions">
                                <el-input
                                    v-model="testCaseForm.assertions"
                                    type="textarea"
                                    rows="5"
                                    placeholder="请输入检查点，例如：$.data.id=1, $.code=200"
                                />
                            </el-form-item>
                        </el-tab-pane>
                    </el-tabs>

                    <div class="case-info">
                        <el-form-item prop="title">
                            <el-input v-model="testCaseForm.title" placeholder="用例标题" />
                        </el-form-item>
                        <el-form-item prop="priority">
                            <el-select v-model="testCaseForm.priority" placeholder="优先级">
                                <el-option label="高" value="高" />
                                <el-option label="中" value="中" />
                                <el-option label="低" value="低" />
                            </el-select>
                        </el-form-item>
                    </div>
                </el-form>
            </el-dialog>
        </PageContainer>
    </Home>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import Home from '@/components/HomePage.vue';
import { 
    Plus, 
    VideoPlay, 
    Edit, 
    Delete, 
    Timer 
} from '@element-plus/icons-vue';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const projectId = ref(route.query.projectId);
const projectName = ref(route.query.projectName);

// 数据相关
const testCases = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const showAddDialog = ref(false);
const dialogTitle = ref('新建接口测试用例');
const testCaseFormRef = ref(null);

// 表单验证规则
const rules = {
    title: [{ required: true, message: '请输入用例标题', trigger: 'blur' }],
    api_path: [{ required: true, message: '请输入接口路径', trigger: 'blur' }],
    method: [{ required: true, message: '请选择请求方法', trigger: 'change' }],
    priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
    headers: [{ 
        validator: (rule, value, callback) => {
            if (value) {
                try {
                    JSON.parse(value);
                    callback();
                } catch (e) {
                    callback(new Error('请输入有效的JSON格式'));
                }
            } else {
                callback();
            }
        },
        trigger: 'blur'
    }],
    body: [{ 
        validator: (rule, value, callback) => {
            if (value) {
                try {
                    JSON.parse(value);
                    callback();
                } catch (e) {
                    callback(new Error('请输入有效的JSON格式'));
                }
            } else {
                callback();
            }
        },
        trigger: 'blur'
    }]
};

// 表单数据
const testCaseForm = ref({
    title: '',
    api_path: '',
    method: 'GET',
    priority: '中',
    headers: '',
    params: '',
    body: '',
    expected_result: '',
    assertions: ''
});

// 修改 fetchTestCases 方法
const fetchTestCases = async () => {
  loading.value = true;
  try {
    const response = await axios.get(
      `http://localhost:8081/api/testcase/list/${projectId.value}`,
      {
        params: {
          page: currentPage.value,
          pageSize: pageSize.value
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    if (response.data.code === 200) {
      // 使用后端返回的数据
      testCases.value = response.data.data.testCases;
      total.value = response.data.data.total;
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    console.error('获取测试用例失败:', error);
    ElMessage.error(error.response?.data?.message || '获取测试用例失败，请检查网络连接');
  } finally {
    loading.value = false;
  }
};

// 提交测试用例
const submitTestCase = async () => {
    if (!testCaseFormRef.value) return;
    
    await testCaseFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                const response = await axios.post(
                    'http://localhost:8081/api/testcase/create/',
                    {
                        ...testCaseForm.value,
                        project_id: projectId.value  // 添加项目ID
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.code === 200) {
                    ElMessage.success('保存成功');
                    showAddDialog.value = false;
                    fetchTestCases();
                } else {
                    ElMessage.error(response.data.message);
                }
            } catch (error) {
                console.error('保存失败:', error);
                ElMessage.error(error.response?.data?.message || '保存失败，请检查网络连接');
            }
        }
    });
};

// 执行测试用例
const runTestCase = async (row) => {
    try {
        const response = await fetch(`http://localhost:8000/api/testcases/${row.case_id}/run`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            ElMessage.success('测试用例执行成功');
            // 可以在这里处理测试结果
        }
    } catch (error) {
        ElMessage.error('测试用例执行失败');
        console.error(error);
    }
};

// 删除测试用例
const deleteTestCase = async (row) => {
    try {
        await ElMessageBox.confirm('确定要删除该测试用例吗？', '提示', {
            type: 'warning',
        });
        
        const response = await fetch(`http://localhost:8000/api/testcases/${row.case_id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            ElMessage.success('删除成功');
            fetchTestCases();
        }
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败');
            console.error(error);
        }
    }
};

// 编辑测试用例
const editTestCase = (row) => {
    dialogTitle.value = '编辑接口测试用例';
    testCaseForm.value = { ...row };
    showAddDialog.value = true;
};

// 分页处理
const handleSizeChange = (val) => {
    pageSize.value = val;
    fetchTestCases();
};

const handleCurrentChange = (val) => {
    currentPage.value = val;
    fetchTestCases();
};

// 标签类型处理
const getPriorityType = (priority) => {
    const types = {
        '高': 'danger',
        '中': 'warning',
        '低': 'info',
    };
    return types[priority] || 'info';
};

const getStatusType = (status) => {
    const types = {
        '通过': 'success',
        '失败': 'danger',
        '阻塞': 'warning',
        '未执行': 'info',
    };
    return types[status] || 'info';
};

const getMethodType = (method) => {
    const types = {
        'GET': 'info',
        'POST': 'success',
        'PUT': 'warning',
        'DELETE': 'danger',
        'PATCH': 'warning'
    };
    return types[method] || 'info';
};

// 格式化日期
const formatDate = (dateString) => {
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(dateString).toLocaleString('zh-CN', options);
};

// 处理新建测试用例
const handleCreateTestCase = () => {
    dialogTitle.value = '新建接口测试用例';
    // 重置表单数据
    testCaseForm.value = {
        title: '',
        api_path: '',
        method: 'GET',
        priority: '中',
        headers: '',
        params: '',
        body: '',
        expected_result: '',
        assertions: ''
    };
    showAddDialog.value = true;
};

// 重置表单
const resetForm = () => {
    if (testCaseFormRef.value) {
        testCaseFormRef.value.resetFields();
    }
    testCaseForm.value = {
        title: '',
        api_path: '',
        method: 'GET',
        priority: '中',
        headers: '',
        params: '',
        body: '',
        expected_result: '',
        assertions: ''
    };
};

// 添加搜索和筛选相关的响应式变量
const searchKeyword = ref('');
const statusFilter = ref('');
const priorityFilter = ref('');

// 添加搜索处理方法
const handleSearch = () => {
    currentPage.value = 1;  // 重置页码
    fetchTestCases();
};

onMounted(() => {
    // 确保有项目ID
    if (!projectId.value) {
        ElMessage.error('请先选择项目');
        router.push('/project');
        return;
    }
    fetchTestCases();
});
</script>

<style scoped>
.table-card {
    margin-top: 20px;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.search-bar {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    align-items: center;
}

.search-input {
    width: 300px;
}

.filter-select {
    width: 150px;
}

.case-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-text {
    color: var(--el-text-color-primary);
    font-weight: 500;
    cursor: pointer;
    transition: color 0.3s;
}

.title-text:hover {
    color: var(--el-color-primary);
}

.priority-tag {
    font-size: 12px;
    border-radius: 12px;
    padding: 0 8px;
}

.api-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.method-tag {
    min-width: 60px;
    text-align: center;
    border-radius: 12px;
}

.api-path {
    color: var(--el-text-color-regular);
    font-family: monospace;
    background: var(--el-fill-color-light);
    padding: 2px 8px;
    border-radius: 4px;
}

.status-tag {
    min-width: 70px;
    border-radius: 12px;
}

.time-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--el-text-color-secondary);
}

.action-buttons {
    display: flex;
    justify-content: center;
    gap: 12px;
}

:deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;
    --el-table-border-color: var(--el-border-color-lighter);
}

:deep(.el-table__row) {
    transition: all 0.3s;
}

:deep(.el-table__row:hover) {
    transform: translateY(-2px);
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
    z-index: 2;
    position: relative;
}

.pagination-container {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
}

:deep(.el-button.is-circle) {
    transition: transform 0.3s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

:deep(.el-button.is-circle:hover) {
    transform: scale(1.1);
}

:deep(.el-button.is-circle .el-icon) {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.create-button {
    padding: 8px 16px;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s;
}

.create-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.create-button .el-icon {
    font-size: 16px;
    margin-right: 4px;
}

:deep(.el-empty) {
    padding: 40px 0;
}

:deep(.el-empty .el-button) {
    margin-top: 20px;
}

.table-operations {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
}

.create-button {
    padding: 8px 16px;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s;
}

.create-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.create-button .el-icon {
    font-size: 16px;
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.search-bar {
    display: flex;
    gap: 16px;
    align-items: center;
}

.table-operations {
    display: flex;
    gap: 16px;
}

.test-case-dialog :deep(.el-dialog__body) {
    padding: 0 20px 20px;
}

.request-header {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    align-items: center;
}

.method-select {
    width: 120px;
    margin-bottom: 0;
}

.api-input {
    flex: 1;
    margin-bottom: 0;
}

.request-tabs {
    margin-bottom: 20px;
}

.request-tabs :deep(.el-tabs__content) {
    padding: 20px;
}

.case-info {
    display: flex;
    gap: 20px;
    align-items: center;
}

.case-info .el-form-item {
    margin-bottom: 0;
}

:deep(.el-select) {
    width: 100%;
}

:deep(.el-tabs--border-card) {
    border: 1px solid var(--el-border-color-light);
    box-shadow: none;
}

:deep(.el-textarea__inner) {
    font-family: monospace;
    font-size: 14px;
}
</style> 