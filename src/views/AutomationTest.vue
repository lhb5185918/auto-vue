<template>
    <Home>
        <PageContainer :title="`${projectName} - 接口自动化测试`">
            <el-card shadow="hover" class="automation-card">
                <!-- 项目信息 -->
                <div class="project-info">
                    <h3 class="project-title">
                        <el-icon><Folder /></el-icon>
                        {{ projectName }}
                    </h3>
                </div>

                <!-- 测试套件配置区域 -->
                <div class="suite-config">
                    <div class="section-header">
                        <h4>测试套件配置</h4>
                        <div class="actions">
                            <el-button type="primary" @click="createNewSuite" :icon="Plus">
                                新建测试套件
                            </el-button>
                            <el-button type="success" @click="runSelectedSuite" :icon="VideoPlay">
                                执行测试
                            </el-button>
                        </div>
                    </div>

                    <!-- 测试套件列表 -->
                    <el-table
                        :data="testSuites"
                        style="width: 100%"
                        @selection-change="handleSuiteSelectionChange"
                    >
                        <el-table-column type="selection" width="55" />
                        <el-table-column prop="name" label="套件名称" min-width="180" />
                        <el-table-column prop="description" label="描述" min-width="200" />
                        <el-table-column prop="caseCount" label="用例数量" width="100" align="center" />
                        <el-table-column prop="lastRunTime" label="最后执行时间" width="160">
                            <template #default="{ row }">
                                {{ row.lastRunTime ? formatDate(row.lastRunTime) : '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="180" fixed="right">
                            <template #default="{ row }">
                                <el-button-group>
                                    <el-tooltip content="执行" placement="top">
                                        <el-button 
                                            type="primary"
                                            @click="runSuite(row)"
                                            :loading="row.executing"
                                            :icon="VideoPlay"
                                            circle
                                        />
                                    </el-tooltip>
                                    <el-tooltip content="编辑" placement="top">
                                        <el-button 
                                            type="primary" 
                                            plain
                                            @click="editSuite(row)"
                                            :icon="Edit"
                                            circle
                                        />
                                    </el-tooltip>
                                    <el-tooltip content="删除" placement="top">
                                        <el-button 
                                            type="danger" 
                                            plain
                                            @click="deleteSuite(row)"
                                            :icon="Delete"
                                            circle
                                        />
                                    </el-tooltip>
                                </el-button-group>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>

                <!-- 测试报告列表 -->
                <div class="report-list">
                    <div class="section-header">
                        <h4>测试报告</h4>
                    </div>
                    <el-table :data="testReports" style="width: 100%">
                        <el-table-column prop="suiteName" label="套件名称" min-width="180" />
                        <el-table-column prop="executionTime" label="执行时间" width="160">
                            <template #default="{ row }">
                                {{ formatDate(row.executionTime) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="执行结果" width="120" align="center">
                            <template #default="{ row }">
                                <el-tag :type="getResultType(row.result)" effect="light">
                                    {{ row.result }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="duration" label="耗时" width="100" align="center">
                            <template #default="{ row }">
                                {{ row.duration }}秒
                            </template>
                        </el-table-column>
                        <el-table-column label="通过率" width="200">
                            <template #default="{ row }">
                                <el-progress 
                                    :percentage="row.passRate"
                                    :status="getProgressStatus(row.passRate)"
                                />
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="120" fixed="right">
                            <template #default="{ row }">
                                <el-tooltip content="查看报告" placement="top">
                                    <el-button 
                                        type="primary" 
                                        @click="viewReport(row)"
                                        :icon="Document"
                                        circle
                                    />
                                </el-tooltip>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </el-card>

            <!-- 测试套件配置对话框 -->
            <el-dialog
                :title="dialogTitle"
                v-model="showSuiteDialog"
                width="90%"
                :close-on-click-modal="false"
                @closed="resetSuiteForm"
                class="suite-dialog"
            >
                <el-form :model="suiteForm" :rules="suiteRules" ref="suiteFormRef" label-width="100px">
                    <!-- 基本信息区域 -->
                    <div class="basic-info-section">
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="套件名称" prop="name">
                                    <el-input v-model="suiteForm.name" placeholder="请输入测试套件名称" />
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="执行环境" prop="envId">
                                    <el-select 
                                        v-model="suiteForm.envId" 
                                        placeholder="请选择执行环境套" 
                                        style="width: 100%"
                                    >
                                        <el-option 
                                            v-for="env in environments" 
                                            :key="env.id" 
                                            :label="env.name" 
                                            :value="env.id"
                                        >
                                            <div class="env-option">
                                                <span class="env-name">{{ env.name }}</span>
                                                <span class="env-desc" v-if="env.description">{{ env.description }}</span>
                                            </div>
                                        </el-option>
                                    </el-select>
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-form-item label="描述" prop="description">
                            <el-input 
                                v-model="suiteForm.description" 
                                type="textarea" 
                                :rows="3"
                                placeholder="请输入测试套件描述"
                            />
                        </el-form-item>
                    </div>

                    <!-- 用例选择区域 -->
                    <div class="case-selection-section">
                        <div class="section-title">测试用例配置</div>
                        <el-row :gutter="20">
                            <!-- 左侧可选用例列表 -->
                            <el-col :span="12">
                                <div class="case-list-container">
                                    <div class="list-header">
                                        <div class="header-left">
                                            <span class="title">可选用例</span>
                                            <el-tag type="info">{{ filteredAvailableCases.length }}个用例</el-tag>
                                        </div>
                                        <el-input
                                            v-model="searchQuery"
                                            placeholder="搜索用例"
                                            prefix-icon="Search"
                                            clearable
                                            class="search-input"
                                        />
                                    </div>
                                    <el-scrollbar>
                                        <draggable
                                            :list="filteredAvailableCases"
                                            :group="{ name: 'cases', pull: 'clone', put: false }"
                                            :clone="cloneCase"
                                            item-key="case_id"
                                            :sort="false"
                                            ghost-class="ghost"
                                            chosen-class="chosen"
                                            @end="handleDragEnd"
                                        >
                                            <template #item="{ element }">
                                                <div class="case-item">
                                                    <div class="case-main">
                                                        <el-tag 
                                                            size="small" 
                                                            :type="getMethodType(element.method)" 
                                                            class="method-tag"
                                                        >
                                                            {{ element.method }}
                                                        </el-tag>
                                                        <span class="case-title">{{ element.title }}</span>
                                                        <el-tag 
                                                            size="small" 
                                                            :type="getPriorityType(element.priority)"
                                                            class="priority-tag"
                                                        >
                                                            {{ element.priority }}
                                                        </el-tag>
                                                    </div>
                                                    <div class="case-info">
                                                        <span class="api-path">{{ element.api_path }}</span>
                                                        <div class="case-meta">
                                                            <span class="meta-item">
                                                                <el-icon><User /></el-icon>
                                                                {{ element.creator?.username || '未知' }}
                                                            </span>
                                                            <span class="meta-item">
                                                                <el-icon><Timer /></el-icon>
                                                                {{ formatDate(element.create_time) }}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>
                                        </draggable>
                                    </el-scrollbar>
                                </div>
                            </el-col>

                            <!-- 右侧测试流程列表 -->
                            <el-col :span="12">
                                <div class="case-list-container">
                                    <div class="list-header">
                                        <div class="header-left">
                                            <span class="title">测试流程</span>
                                            <el-tag type="success">{{ suiteForm.selectedCases.length }}个用例</el-tag>
                                        </div>
                                        <el-button 
                                            type="danger" 
                                            size="small" 
                                            plain
                                            @click="clearSelectedCases"
                                            :disabled="!suiteForm.selectedCases.length"
                                        >
                                            清空
                                        </el-button>
                                    </div>
                                    <el-scrollbar>
                                        <draggable
                                            v-model="suiteForm.selectedCases"
                                            :group="{ name: 'cases', put: true }"
                                            item-key="case_id"
                                            ghost-class="ghost"
                                            chosen-class="chosen"
                                            handle=".drag-handle"
                                            @change="handleSelectedCasesChange"
                                        >
                                            <template #item="{ element, index }">
                                                <div class="case-item selected">
                                                    <div class="case-main">
                                                        <el-icon class="drag-handle"><Rank /></el-icon>
                                                        <span class="case-order">#{{ index + 1 }}</span>
                                                        <el-tag 
                                                            size="small" 
                                                            :type="getMethodType(element.method)"
                                                            class="method-tag"
                                                        >
                                                            {{ element.method }}
                                                        </el-tag>
                                                        <span class="case-title">{{ element.title }}</span>
                                                    </div>
                                                    <div class="case-actions">
                                                        <el-button
                                                            type="danger"
                                                            size="small"
                                                            circle
                                                            plain
                                                            :icon="Delete"
                                                            @click="removeSelectedCase(index)"
                                                        />
                                                    </div>
                                                </div>
                                            </template>
                                        </draggable>
                                    </el-scrollbar>
                                </div>
                            </el-col>
                        </el-row>
                    </div>
                </el-form>

                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="showSuiteDialog = false">取消</el-button>
                        <el-button type="primary" @click="saveSuite">确定</el-button>
                    </div>
                </template>
            </el-dialog>

            <!-- 测试报告详情对话框 -->
            <el-dialog
                title="测试报告详情"
                v-model="showReportDialog"
                width="80%"
                class="report-dialog"
            >
                <div class="report-content" v-if="currentReport">
                    <div class="report-header">
                        <h2>{{ currentReport.suiteName }} - 测试报告</h2>
                        <div class="report-meta">
                            <div class="meta-item">
                                <span class="label">执行时间：</span>
                                <span>{{ formatDate(currentReport.executionTime) }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="label">总耗时：</span>
                                <span>{{ currentReport.duration }}秒</span>
                            </div>
                            <div class="meta-item">
                                <span class="label">执行环境：</span>
                                <span>{{ currentReport.environment }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="report-summary">
                        <el-row :gutter="20">
                            <el-col :span="6">
                                <div class="summary-card total">
                                    <div class="number">{{ currentReport.totalCases }}</div>
                                    <div class="label">总用例数</div>
                                </div>
                            </el-col>
                            <el-col :span="6">
                                <div class="summary-card passed">
                                    <div class="number">{{ currentReport.passedCases }}</div>
                                    <div class="label">通过用例数</div>
                                </div>
                            </el-col>
                            <el-col :span="6">
                                <div class="summary-card failed">
                                    <div class="number">{{ currentReport.failedCases }}</div>
                                    <div class="label">失败用例数</div>
                                </div>
                            </el-col>
                            <el-col :span="6">
                                <div class="summary-card rate">
                                    <div class="number">{{ currentReport.passRate }}%</div>
                                    <div class="label">通过率</div>
                                </div>
                            </el-col>
                        </el-row>
                    </div>

                    <div class="case-details">
                        <h3>用例执行详情</h3>
                        <el-table :data="currentReport.caseResults" border>
                            <el-table-column prop="title" label="用例名称" min-width="200" />
                            <el-table-column prop="api" label="接口" min-width="200">
                                <template #default="{ row }">
                                    <div class="api-info">
                                        <el-tag :type="getMethodType(row.method)" size="small">
                                            {{ row.method }}
                                        </el-tag>
                                        <span>{{ row.api }}</span>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="duration" label="耗时" width="100" align="center">
                                <template #default="{ row }">
                                    {{ row.duration }}ms
                                </template>
                            </el-table-column>
                            <el-table-column label="状态" width="100" align="center">
                                <template #default="{ row }">
                                    <el-tag :type="getStatusType(row.status)">
                                        {{ row.status }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="message" label="详细信息" min-width="300" />
                        </el-table>
                    </div>
                </div>
            </el-dialog>
        </PageContainer>
    </Home>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import Home from '@/components/HomePage.vue';
import { 
    Plus, 
    VideoPlay, 
    Edit, 
    Delete, 
    Document,
    Folder,
    Search,
    Rank,
    User,
    Timer
} from '@element-plus/icons-vue';
import axios from 'axios';
import draggable from 'vuedraggable';

const router = useRouter();
const route = useRoute();

// 项目信息
const projectId = ref(route.query.projectId);
const projectName = ref(route.query.projectName || '未知项目');

// 测试套件相关数据
const testSuites = ref([]);
const selectedSuites = ref([]);
const showSuiteDialog = ref(false);
const dialogTitle = ref('新建测试套件');
const suiteFormRef = ref(null);

// 测试套件表单
const suiteForm = ref({
    name: '',
    description: '',
    envId: '',
    selectedCases: []
});

// 环境和用例数据
const environments = ref([]);
const availableCases = ref([]);
const loading = ref(false);

// 测试报告相关数据
const testReports = ref([]);
const showReportDialog = ref(false);
const currentReport = ref(null);

// 表单验证规则
const suiteRules = {
    name: [
        { required: true, message: '请输入套件名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    envId: [
        { required: true, message: '请选择执行环境', trigger: 'change' }
    ]
};

// 添加搜索和过滤相关的响应式数据
const searchQuery = ref('')
const filteredAvailableCases = computed(() => {
    // 先过滤掉已选择的用例
    const unusedCases = availableCases.value.filter(availableCase => 
        !suiteForm.value.selectedCases.some(selectedCase => 
            selectedCase.case_id === availableCase.case_id ||
            selectedCase.case_id.startsWith(availableCase.case_id + '_')
        )
    );
    
    // 再根据搜索条件过滤
    if (!searchQuery.value) {
        return unusedCases;
    }
    
    const query = searchQuery.value.toLowerCase();
    return unusedCases.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.path?.toLowerCase().includes(query) ||
        item.method?.toLowerCase().includes(query)
    );
});

// 过滤可用用例
const filterAvailableCases = () => {
    // 使用计算属性，不需要在这里实现
};

// 克隆用例方法
const cloneCase = (item) => {
    console.log('Cloning case:', item);
    return {
        ...JSON.parse(JSON.stringify(item)),
        case_id: `${item.case_id}_${Date.now()}`,
        _isClone: true,
        original_id: item.case_id // 保存原始ID，用于恢复显示
    };
};

// 处理拖拽结束
const handleDragEnd = (evt) => {
    console.log('Drag end:', evt);
};

// 处理已选用例变化
const handleSelectedCasesChange = (evt) => {
    console.log('Selection change:', evt);
    if (evt.added) {
        // 添加用例
        const addedCase = evt.added.element;
        console.log('Added case:', addedCase);
        // 确保不重复添加相同的用例
        if (!suiteForm.value.selectedCases.some(c => c.case_id === addedCase.case_id)) {
            ElMessage.success('用例添加成功');
        }
    } else if (evt.removed) {
        // 移除用例 - 不需要特殊处理，因为计算属性会自动更新可用列表
        console.log('Removed case:', evt.removed.element);
        ElMessage.success('用例移除成功');
    } else if (evt.moved) {
        // 调整顺序
        console.log('Moved case:', evt.moved);
        ElMessage.success('用例顺序已更新');
    }
};

// 移除选中的用例
const removeSelectedCase = (index) => {
    suiteForm.value.selectedCases.splice(index, 1);
    ElMessage.success('用例已移除');
};

// 清空选中的用例
const clearSelectedCases = () => {
    ElMessageBox.confirm('确定要清空所有已选用例吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        suiteForm.value.selectedCases = [];
        ElMessage.success('已清空所有用例');
    }).catch(() => {});
};

// 重置表单时清空选中的用例
const resetSuiteForm = () => {
    suiteForm.value = {
        name: '',
        description: '',
        envId: '',
        selectedCases: []
    };
};

// 监听选中用例的变化
watch(() => suiteForm.value.selectedCases, (newValue) => {
    console.log('Selected cases changed:', newValue);
}, { deep: true });

// 监听搜索词变化
watch(searchQuery, () => {
    filterAvailableCases()
})

// 初始化过滤后的用例列表
onMounted(() => {
    filteredAvailableCases.value = availableCases.value
})

// 获取测试套件列表
const fetchTestSuites = async () => {
    try {
        const response = await axios.get(
            `http://localhost:8081/api/suite/list/${projectId.value}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            testSuites.value = response.data.data;
        }
    } catch (error) {
        console.error('获取测试套件失败:', error);
        ElMessage.error('获取测试套件失败');
    }
};

// 获取环境列表
const fetchEnvironments = async () => {
    try {
        const response = await axios.get(
            `http://localhost:8081/api/env-suite/list/${projectId.value}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            // 根据实际返回的数据结构进行映射
            environments.value = response.data.data.items.map(env => ({
                id: env.id,
                name: env.name,
                description: env.description || '',
                create_time: env.create_time,
                update_time: env.update_time
            }));
        }
    } catch (error) {
        console.error('获取环境套列表失败:', error);
        ElMessage.error('获取环境套列表失败');
    }
};

// 获取测试用例列表
const fetchTestCases = async () => {
    const projectId = route.query.projectId;
    if (!projectId) {
        ElMessage.warning('请先选择项目');
        return;
    }

    loading.value = true;
    try {
        const response = await fetch(`http://localhost:8081/api/testcase/list/${projectId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();
        if (data.code === 200) {
            // 确保每个用例都有唯一的 case_id
            availableCases.value = data.data.testCases.map(item => ({
                ...item,
                case_id: item.case_id.toString()
            }));
        } else {
            ElMessage.error(data.message || '获取测试用例失败');
        }
    } catch (error) {
        console.error('获取测试用例失败:', error);
        ElMessage.error('获取测试用例失败');
    } finally {
        loading.value = false;
    }
};

// 获取请求方法��应的类型
const getMethodType = (method) => {
    const methodMap = {
        'GET': 'success',
        'POST': 'primary',
        'PUT': 'warning',
        'DELETE': 'danger',
        'PATCH': 'info'
    };
    return methodMap[method?.toUpperCase()] || 'info';
};

// 在组件挂载时获取测试用例
onMounted(() => {
    fetchTestCases();
});

// 监听路由参数变化，当项目ID变化时重新获取用例
watch(
    () => route.query.projectId,
    (newProjectId) => {
        if (newProjectId) {
            fetchTestCases();
        } else {
            availableCases.value = [];
        }
    }
);

// 创建新的测试套件
const createNewSuite = () => {
    dialogTitle.value = '新建测试套件';
    showSuiteDialog.value = true;
};

// 保存测试套件
const saveSuite = async () => {
    if (!suiteFormRef.value) return;
    
    await suiteFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                const response = await axios.post(
                    'http://localhost:8081/api/suite/create',
                    {
                        ...suiteForm.value,
                        project_id: projectId.value
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                if (response.data.code === 200) {
                    ElMessage.success('测试套件保存成功');
                    showSuiteDialog.value = false;
                    fetchTestSuites();
                }
            } catch (error) {
                console.error('保存测试套件失败:', error);
                ElMessage.error('保存测试套件失败');
            }
        }
    });
};

// 执行测试套件
const runSuite = async (suite) => {
    try {
        suite.executing = true;
        const response = await axios.post(
            `http://localhost:8081/api/suite/execute/${suite.id}`,
            null,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            ElMessage.success('测试套件执行成功');
            // 刷新测试报告列表
            fetchTestReports();
        }
    } catch (error) {
        console.error('执行测试套件失败:', error);
        ElMessage.error('执行测试套件失败');
    } finally {
        suite.executing = false;
    }
};

// 获取测试报告列表
const fetchTestReports = async () => {
    try {
        const response = await axios.get(
            `http://localhost:8081/api/report/list/${projectId.value}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            testReports.value = response.data.data;
        }
    } catch (error) {
        console.error('获取测试报告失败:', error);
        ElMessage.error('获取测试报告失败');
    }
};

// 查看测试报告
const viewReport = async (report) => {
    try {
        const response = await axios.get(
            `http://localhost:8081/api/report/detail/${report.id}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            currentReport.value = response.data.data;
            showReportDialog.value = true;
        }
    } catch (error) {
        console.error('获取报告详情失败:', error);
        ElMessage.error('获取报告详情失败');
    }
};

// 工具方法
const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

const getStatusType = (status) => {
    const types = {
        '通过': 'success',
        '失败': 'danger',
        '未执行': 'warning'
    };
    return types[status] || 'info';
};

const getResultType = (result) => {
    return result === '通过' ? 'success' : 'danger';
};

const getProgressStatus = (rate) => {
    if (rate >= 90) return 'success';
    if (rate >= 60) return 'warning';
    return 'exception';
};

// 组件挂载时初始化数据
onMounted(async () => {
    if (!projectId.value) {
        ElMessage.error('请选择项目');
        router.push('/project');
        return;
    }

    try {
        await Promise.all([
            fetchTestSuites(),
            fetchEnvironments(),
            fetchTestReports()
        ]);
    } catch (error) {
        console.error('初始化数据失败:', error);
    }
});

// 获取优先级对应的类型
const getPriorityType = (priority) => {
    const types = {
        '高': 'danger',
        '中': 'warning',
        '低': 'info'
    };
    return types[priority] || 'info';
};
</script>

<style scoped>
.automation-card {
    margin-top: 20px;
    padding: 24px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.section-header h4 {
    margin: 0;
    font-size: 16px;
    color: var(--el-text-color-primary);
}

.suite-config {
    margin-bottom: 24px;
}

.case-selection {
    margin-top: 20px;
}

.case-list-container {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    height: 600px;
    display: flex;
    flex-direction: column;
}

.list-header {
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.search-input {
    width: 200px;
}

.case-item {
    padding: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background-color: #fff;
    cursor: grab;
    user-select: none;
    position: relative;
}

.case-item:hover {
    background-color: var(--el-fill-color-light);
}

.case-item:active {
    cursor: grabbing;
}

.case-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.method-tag {
    min-width: 60px;
    text-align: center;
}

.case-title {
    flex: 1;
    font-size: 14px;
}

.case-path {
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.case-order {
    color: var(--el-text-color-secondary);
    font-size: 14px;
    min-width: 30px;
}

.drag-handle {
    cursor: move;
    color: var(--el-text-color-secondary);
    margin-right: 8px;
    transition: color 0.2s ease;
}

.drag-handle:hover {
    color: var(--el-color-primary);
}

.ghost {
    opacity: 0.5;
    background: #c8ebfb !important;
    border: 2px dashed #409EFF !important;
}

.chosen {
    background-color: #ecf5ff !important;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.case-actions {
    display: flex;
    gap: 8px;
}

.selected {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* 优化滚动条样式 */
:deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
}

.report-content {
    padding: 20px;
}

.report-header {
    margin-bottom: 24px;
}

.report-header h2 {
    margin: 0 0 16px 0;
    color: var(--el-text-color-primary);
}

.report-meta {
    display: flex;
    gap: 24px;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.meta-item .label {
    color: var(--el-text-color-secondary);
}

.report-summary {
    margin-bottom: 24px;
}

.summary-card {
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    color: #fff;
}

.summary-card.total {
    background-color: #409EFF;
}

.summary-card.passed {
    background-color: #67C23A;
}

.summary-card.failed {
    background-color: #F56C6C;
}

.summary-card.rate {
    background-color: #E6A23C;
}

.summary-card .number {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
}

.summary-card .label {
    font-size: 14px;
}

.case-details {
    margin-top: 24px;
}

.case-details h3 {
    margin: 0 0 16px 0;
    color: var(--el-text-color-primary);
}

.api-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 项目信息样式 */
.project-info {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.project-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 18px;
    color: var(--el-text-color-primary);
}

.project-title .el-icon {
    font-size: 20px;
    color: var(--el-color-primary);
}

/* 添加优先级标签样式 */
.priority-tag {
    margin-left: 8px;
}

.case-meta {
    display: flex;
    gap: 16px;
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
}

/* 优化拖拽相关样式 */
.case-item {
    cursor: grab;
    user-select: none;
    transition: background-color 0.2s ease;
    position: relative;
}

.case-item:active {
    cursor: grabbing;
}

.ghost {
    opacity: 0.5;
    background: #c8ebfb !important;
    border: 2px dashed #409EFF !important;
}

.chosen {
    background-color: #ecf5ff !important;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.drag-handle {
    cursor: move;
    color: var(--el-text-color-secondary);
    margin-right: 8px;
    transition: color 0.2s ease;
}

.drag-handle:hover {
    color: var(--el-color-primary);
}

/* 优化拖拽时的视觉反馈 */
.case-item.sortable-chosen {
    background-color: #ecf5ff;
    border: 1px solid #409EFF;
}

.case-item.sortable-ghost {
    opacity: 0.5;
    background: #c8ebfb;
    border: 2px dashed #409EFF;
}

/* 修改对话框尺寸 */
:deep(.el-dialog) {
  margin-top: 2vh !important;
  height: 98vh;  /* 增加对话框高度 */
  width: 90% !important;  /* 增加对话框宽度 */
}

:deep(.el-dialog__body) {
  padding: 20px;
  height: calc(90vh - 120px);  /* 增加主体区域高度 */
  overflow: auto;
}

/* 增加用例列表容器高度 */
.case-list-container {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  height: calc(85vh - 100px);  /* 增加容器高度 */
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

/* 修改滚动区域高度 */
.el-scrollbar {
  height: calc(100% - 50px) !important;
  flex: 1;
}

/* 调整列表项布局 */
.case-item {
  padding: 12px 16px;  /* 增加内边距 */
  min-height: 70px;    /* 增加最小高度 */
}

/* 调整搜索框宽度 */
.search-input {
  width: 250px;  /* 增加搜索框宽度 */
}

/* 调整表单布局 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

/* 调整描述文本框高度 */
:deep(.el-form-item__content .el-textarea__inner) {
  height: 80px;
}

/* 优化列间 */
:deep(.el-row) {
  margin: 0 !important;  /* 移除默认外边距 */
}

:deep(.el-col) {
  padding: 0 15px !important;  /* 增加列间距 */
}

/* 调整列表头部样式 */
.list-header {
  padding: 16px;  /* 增加内边距 */
  height: 60px;   /* 固定头部高度 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

/* 优按钮样式 */
.list-header .el-button {
  margin-left: 16px;
}

/* 调整例信息布局 */
.case-info {
  gap: 12px;  /* 增加元素间距 */
}

.case-meta {
  margin-top: 8px;
  gap: 20px;  /* 增加元素间距 */
}

/* 优化标签样式 */
.method-tag,
.priority-tag {
  min-width: 70px;  /* 增加标签宽度 */
  text-align: center;
}

/* 对话框样式优化 */
.suite-dialog :deep(.el-dialog__body) {
  padding: 0 20px;
}

/* 基本信息区域样式 */
.basic-info-section {
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

/* 用例选择区域样式 */
.case-selection-section {
  padding: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 20px;
}

/* 列表容器样式优化 */
.case-list-container {
  height: 600px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background-color: var(--el-bg-color);
}

.list-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-fill-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left .title {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

/* 用例项式优化 */
.case-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);
  transition: all 0.3s ease;
}

.case-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.case-info {
  padding-left: 32px;
  font-size: 13px;
}

.api-path {
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
  display: block;
}

.case-meta {
  display: flex;
  gap: 16px;
  color: var(--el-text-color-secondary);
}

.method-tag {
  min-width: 60px;
  text-align: center;
}

.case-title {
  flex: 1;
  font-weight: 500;
}

/* 拖拽相关样式 */
.ghost {
  opacity: 0.5;
  background: var(--el-color-primary-light-9) !important;
  border: 2px dashed var(--el-color-primary) !important;
}

.chosen {
  background: var(--el-fill-color-lighter) !important;
}

.drag-handle {
  cursor: move;
  color: var(--el-text-color-secondary);
  transition: color 0.2s ease;
}

.drag-handle:hover {
  color: var(--el-color-primary);
}

/* 滚动条样式优化 */
.el-scrollbar {
  height: calc(100% - 52px);
}

:deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

/* 搜索框样式 */
.search-input {
  width: 220px;
}

/* 响应式布局调整 */
@media (max-width: 1400px) {
  .case-list-container {
    height: 500px;
  }
}

.env-option {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.env-name {
    font-size: 14px;
    color: var(--el-text-color-primary);
}

.env-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

/* 确保下拉选项有足够的高度显示描述文本 */
:deep(.el-select-dropdown__item) {
    height: auto;
    padding: 8px 12px;
}
</style> 