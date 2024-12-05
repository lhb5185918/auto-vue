<template>
    <Home>
        <PageContainer title="接口测试用例管理">
            <template #actions>
                <el-button 
                    type="primary" 
                    @click="showAddDialog = true"
                    :icon="Plus"
                    class="create-button"
                >
                    新建接口测试用例
                </el-button>
            </template>

            <!-- 测试用例表格 -->
            <el-card shadow="never" class="table-card">
                <div class="table-operations">
                    <el-button 
                        type="primary" 
                        @click="showAddDialog = true"
                        :icon="Plus"
                        class="create-button"
                    >
                        新建接口测试用例
                    </el-button>
                </div>

                <el-empty
                    v-if="testCases.length === 0"
                    description="暂无测试用例"
                >
                    <el-button
                        type="primary"
                        @click="showAddDialog = true"
                        :icon="Plus"
                    >
                        创建测试用例
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
                        fontWeight: 500
                    }"
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

                <!-- 分页器 -->
                <div class="pagination-container">
                    <el-pagination
                        v-model:current-page="currentPage"
                        v-model:page-size="pageSize"
                        :total="total"
                        :page-sizes="[10, 20, 50, 100]"
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
                width="70%"
            >
                <el-form :model="testCaseForm" :rules="rules" ref="testCaseFormRef" label-width="120px">
                    <el-form-item label="用例标题" prop="title">
                        <el-input v-model="testCaseForm.title" placeholder="请输入用例标题" />
                    </el-form-item>
                    <el-form-item label="接口路径" prop="api_path">
                        <el-input v-model="testCaseForm.api_path" placeholder="请输入接口路径，例如：/api/users" />
                    </el-form-item>
                    <el-form-item label="请求方法" prop="method">
                        <el-select v-model="testCaseForm.method">
                            <el-option label="GET" value="GET" />
                            <el-option label="POST" value="POST" />
                            <el-option label="PUT" value="PUT" />
                            <el-option label="DELETE" value="DELETE" />
                            <el-option label="PATCH" value="PATCH" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="优先级" prop="priority">
                        <el-select v-model="testCaseForm.priority">
                            <el-option label="高" value="高" />
                            <el-option label="中" value="中" />
                            <el-option label="低" value="低" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="请求头" prop="headers">
                        <el-input
                            v-model="testCaseForm.headers"
                            type="textarea"
                            rows="3"
                            placeholder="请输入请求头（JSON格式）"
                        />
                    </el-form-item>
                    <el-form-item label="请求参数" prop="params">
                        <el-input
                            v-model="testCaseForm.params"
                            type="textarea"
                            rows="3"
                            placeholder="请输入请求参数（JSON格式）"
                        />
                    </el-form-item>
                    <el-form-item label="请求体" prop="body">
                        <el-input
                            v-model="testCaseForm.body"
                            type="textarea"
                            rows="5"
                            placeholder="请输入请求体（JSON格式）"
                        />
                    </el-form-item>
                    <el-form-item label="预期结果" prop="expected_result">
                        <el-input
                            v-model="testCaseForm.expected_result"
                            type="textarea"
                            rows="3"
                            placeholder="请输入预期结果（JSON格式）"
                        />
                    </el-form-item>
                    <el-form-item label="检查点" prop="assertions">
                        <el-input
                            v-model="testCaseForm.assertions"
                            type="textarea"
                            rows="3"
                            placeholder="请输入检查点，例如：$.data.id=1, $.code=200"
                        />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="showAddDialog = false">取消</el-button>
                        <el-button type="primary" @click="submitTestCase">确定</el-button>
                    </span>
                </template>
            </el-dialog>
        </PageContainer>
    </Home>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import Home from '@/components/HomePage.vue';
import { 
    Plus, 
    VideoPlay, 
    Edit, 
    Delete, 
    Timer 
} from '@element-plus/icons-vue';

const route = useRoute();
const projectId = route.params.projectId;

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

// 在 script setup 中添加默认的测试用例数据
const defaultTestCases = [
  {
    case_id: 1,
    title: "用户登录接口测试",
    api_path: "/api/login",
    method: "POST",
    priority: "高",
    status: "通过",
    headers: JSON.stringify({
      "Content-Type": "application/json"
    }, null, 2),
    params: "{}",
    body: JSON.stringify({
      "username": "admin",
      "password": "password123"
    }, null, 2),
    expected_result: JSON.stringify({
      "code": 200,
      "message": "登录成功"
    }, null, 2),
    assertions: "$.code=200, $.message=登录成功",
    create_time: "2024-01-15 10:00:00"
  },
  {
    case_id: 2,
    title: "获取用户信息接口测试",
    api_path: "/api/user/info",
    method: "GET",
    priority: "中",
    status: "失败",
    headers: JSON.stringify({
      "Authorization": "Bearer {{token}}"
    }, null, 2),
    params: JSON.stringify({
      "userId": 1
    }, null, 2),
    body: "{}",
    expected_result: JSON.stringify({
      "code": 200,
      "data": {
        "username": "admin",
        "email": "admin@example.com"
      }
    }, null, 2),
    assertions: "$.code=200, $.data.username=admin",
    create_time: "2024-01-15 11:30:00"
  },
  {
    case_id: 3,
    title: "创建项目接口测试",
    api_path: "/api/project",
    method: "POST",
    priority: "高",
    status: "通过",
    headers: JSON.stringify({
      "Content-Type": "application/json",
      "Authorization": "Bearer {{token}}"
    }, null, 2),
    params: "{}",
    body: JSON.stringify({
      "name": "测试项目",
      "description": "这是一个测试项目"
    }, null, 2),
    expected_result: JSON.stringify({
      "code": 200,
      "message": "创建成功"
    }, null, 2),
    assertions: "$.code=200, $.message=创建成功",
    create_time: "2024-01-15 14:20:00"
  },
  {
    case_id: 4,
    title: "查询项目列表接口测试",
    api_path: "/api/projects",
    method: "GET",
    priority: "中",
    status: "阻塞",
    headers: JSON.stringify({
      "Authorization": "Bearer {{token}}"
    }, null, 2),
    params: JSON.stringify({
      "page": 1,
      "size": 10
    }, null, 2),
    body: "{}",
    expected_result: JSON.stringify({
      "code": 200,
      "data": {
        "total": 10,
        "items": []
      }
    }, null, 2),
    assertions: "$.code=200, $.data.total>=0",
    create_time: "2024-01-15 15:45:00"
  },
  {
    case_id: 5,
    title: "删除项目接口测试",
    api_path: "/api/project/{id}",
    method: "DELETE",
    priority: "高",
    status: "通过",
    headers: JSON.stringify({
      "Authorization": "Bearer {{token}}"
    }, null, 2),
    params: JSON.stringify({
      "id": 1
    }, null, 2),
    body: "{}",
    expected_result: JSON.stringify({
      "code": 200,
      "message": "删除成功"
    }, null, 2),
    assertions: "$.code=200, $.message=删除成功",
    create_time: "2024-01-15 16:30:00"
  }
];

// 修改 fetchTestCases 方法
const fetchTestCases = async () => {
  loading.value = true;
  try {
    // 使用默认数据替代接口调用
    testCases.value = defaultTestCases;
    total.value = defaultTestCases.length;
    
    /* 注释掉原有的接口调用代码
    const response = await fetch(
      `http://localhost:8000/api/projects/${projectId}/testcases/?page=${currentPage.value}&size=${pageSize.value}`
    );
    const data = await response.json();
    testCases.value = data.items;
    total.value = data.total;
    */
  } catch (error) {
    ElMessage.error('获取测试用例失败');
    console.error(error);
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
                const url = `http://localhost:8000/api/projects/${projectId}/testcases/`;
                const method = testCaseForm.value.id ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...testCaseForm.value,
                        project_id: projectId
                    }),
                });

                if (response.ok) {
                    ElMessage.success('保存成功');
                    showAddDialog.value = false;
                    fetchTestCases();
                }
            } catch (error) {
                ElMessage.error('保存失败');
                console.error(error);
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

onMounted(() => {
    // 确保有项目ID
    if (!projectId) {
        ElMessage.error('未选择项目');
        router.push('/project');
        return;
    }
    fetchTestCases();
});
</script>

<style scoped>
.table-card {
    margin-top: 20px;
    padding: 20px;
}

.case-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-text {
    color: var(--el-text-color-primary);
    font-weight: 500;
}

.priority-tag {
    font-size: 12px;
}

.api-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.method-tag {
    min-width: 50px;
    text-align: center;
}

.api-path {
    color: var(--el-text-color-regular);
    font-family: monospace;
}

.status-tag {
    min-width: 60px;
}

.time-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: var(--el-text-color-secondary);
}

.action-buttons {
    display: flex;
    justify-content: center;
    gap: 8px;
}

.action-buttons .el-button {
    padding: 0;
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.action-buttons .el-button .el-icon {
    margin: 0;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
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

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

:deep(.el-table) {
    border-radius: 4px;
    overflow: hidden;
}

:deep(.el-table__header) {
    font-weight: 500;
}

:deep(.el-table__row) {
    transition: background-color 0.3s;
}

:deep(.el-table__row:hover) {
    background-color: var(--el-fill-color-light) !important;
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
</style> 