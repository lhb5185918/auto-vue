<template>
    <Home>
        <div class="content">
            <div class="header">
                <h1>接口测试用例管理</h1>
                <el-button type="primary" @click="showAddDialog = true">
                    新建接口测试用例
                </el-button>
            </div>

            <!-- 测试用例表格 -->
            <el-table :data="testCases" border style="width: 100%" v-loading="loading">
                <el-table-column prop="case_id" label="用例ID" width="80" />
                <el-table-column prop="title" label="用例标题" width="150" />
                <el-table-column prop="api_path" label="接口路径" width="200" />
                <el-table-column prop="method" label="请求方法" width="100">
                    <template #default="{ row }">
                        <el-tag :type="getMethodType(row.method)">
                            {{ row.method }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="priority" label="优先级" width="80">
                    <template #default="{ row }">
                        <el-tag :type="getPriorityType(row.priority)">
                            {{ row.priority }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="80">
                    <template #default="{ row }">
                        <el-tag :type="getStatusType(row.status)">
                            {{ row.status }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="create_time" label="创建时间" width="160">
                    <template #default="{ row }">
                        {{ formatDate(row.create_time) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                        <el-button-group>
                            <el-button size="small" @click="runTestCase(row)">执行</el-button>
                            <el-button size="small" @click="editTestCase(row)">编辑</el-button>
                            <el-button size="small" type="danger" @click="deleteTestCase(row)">删除</el-button>
                        </el-button-group>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页器 -->
            <div class="pagination">
                <el-pagination
                    v-model:current-page="currentPage"
                    v-model:page-size="pageSize"
                    :total="total"
                    :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next"
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                />
            </div>

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
        </div>
    </Home>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import Home from '@/components/HomePage.vue';

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

// 获取测试用例列表
const fetchTestCases = async () => {
    loading.value = true;
    try {
        const response = await fetch(
            `http://localhost:8000/api/projects/${projectId}/testcases/?page=${currentPage.value}&size=${pageSize.value}`
        );
        const data = await response.json();
        testCases.value = data.items;
        total.value = data.total;
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
        'GET': 'success',
        'POST': 'primary',
        'PUT': 'warning',
        'DELETE': 'danger',
        'PATCH': 'info',
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
.content {
    padding: 20px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

:deep(.el-table) {
    margin-top: 20px;
}

:deep(.el-tag) {
    margin-right: 5px;
}

:deep(.el-form-item) {
    margin-bottom: 22px;
}
</style> 