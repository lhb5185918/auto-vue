<template>
    <Home>
        <div class="content">
            <div class="header">
                <h1>项目管理</h1>
                <div class="header-right">
                    <el-button type="primary" @click="showAddDialog = true">
                        新建项目
                    </el-button>
                </div>
            </div>

            <!-- 搜索区域 -->
            <div class="search-area">
                <el-form :inline="true" :model="searchForm" class="search-form">
                    <el-form-item label="项目名称">
                        <el-input
                            v-model="searchForm.projectName"
                            placeholder="请输入项目名称"
                            clearable
                            @keyup.enter="handleSearch"
                        />
                    </el-form-item>
                    <el-form-item label="创建时间">
                        <el-date-picker
                            v-model="searchForm.dateRange"
                            type="daterange"
                            range-separator="至"
                            start-placeholder="开始日期"
                            end-placeholder="结束日期"
                            value-format="YYYY-MM-DD"
                        />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="handleSearch">搜索</el-button>
                        <el-button @click="resetSearch">重置</el-button>
                    </el-form-item>
                </el-form>
            </div>

            <!-- 项目列表展示 -->
            <div class="project-grid">
                <el-card v-for="project in projects" 
                        :key="project.project_id" 
                        class="project-card"
                        :body-style="{ padding: '0px' }">
                    <div class="project-card-header">
                        <span class="project-id">#{{ project.project_id }}</span>
                        <h3>{{ project.project_name }}</h3>
                    </div>
                    <div class="project-card-content">
                        <p class="description">{{ project.description || '暂无描述' }}</p>
                        <div class="project-info">
                            <el-tooltip content="创建时间" placement="top">
                                <div class="info-item">
                                    <el-icon><Calendar /></el-icon>
                                    {{ formatDate(project.create_time) }}
                                </div>
                            </el-tooltip>
                            <el-tooltip content="更新时间" placement="top">
                                <div class="info-item">
                                    <el-icon><Timer /></el-icon>
                                    {{ formatDate(project.update_time) }}
                                </div>
                            </el-tooltip>
                        </div>
                    </div>
                    <div class="project-card-actions">
                        <el-button-group>
                            <el-button type="primary" @click="goToTestCases(project)" size="small">
                                <el-icon><Document /></el-icon>测试用例
                            </el-button>
                            <el-button @click="editProject(project)" size="small">
                                <el-icon><Edit /></el-icon>编辑
                            </el-button>
                            <el-button type="danger" @click="deleteProject(project)" size="small">
                                <el-icon><Delete /></el-icon>删除
                            </el-button>
                        </el-button-group>
                    </div>
                </el-card>
            </div>

            <!-- 分页器 -->
            <div class="pagination">
                <el-pagination
                    v-model:current-page="currentPage"
                    v-model:page-size="pageSize"
                    :total="total"
                    :page-sizes="[8, 16, 24, 32]"
                    layout="total, sizes, prev, pager, next"
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                />
            </div>

            <!-- 新建/编辑项目对话框 -->
            <el-dialog
                :title="dialogTitle"
                v-model="showAddDialog"
                width="50%"
            >
                <el-form :model="projectForm" :rules="rules" ref="projectFormRef" label-width="100px">
                    <el-form-item label="项目名称" prop="project_name">
                        <el-input v-model="projectForm.project_name" placeholder="请输入项目名称" />
                    </el-form-item>
                    <el-form-item label="项目描述" prop="description">
                        <el-input
                            v-model="projectForm.description"
                            type="textarea"
                            rows="3"
                            placeholder="请输入项目描述"
                        />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="showAddDialog = false">取消</el-button>
                        <el-button type="primary" @click="submitProject">确定</el-button>
                    </span>
                </template>
            </el-dialog>
        </div>
    </Home>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Calendar, Timer, Document, Edit, Delete } from '@element-plus/icons-vue';
import Home from '@/components/HomePage.vue';

const router = useRouter();
const projects = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(8);
const total = ref(0);
const showAddDialog = ref(false);
const dialogTitle = ref('新建项目');
const projectFormRef = ref(null);

// 搜索表单
const searchForm = ref({
    projectName: '',
    dateRange: []
});

// 项目表单
const projectForm = ref({
    project_name: '',
    description: ''
});

// 表单验证规则
const rules = {
    project_name: [
        { required: true, message: '请输入项目名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    description: [
        { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
    ]
};

// 修改获取项目列表的方法
const fetchProjects = async () => {
    loading.value = true;
    try {
        let url = `http://localhost:8000/api/project/?page=${currentPage.value}&size=${pageSize.value}`;
        
        // 添加搜索参数
        if (searchForm.value.projectName) {
            url += `&project_name=${encodeURIComponent(searchForm.value.projectName)}`;
        }
        if (searchForm.value.dateRange?.length === 2) {
            url += `&start_date=${searchForm.value.dateRange[0]}&end_date=${searchForm.value.dateRange[1]}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        projects.value = data.project;
        total.value = data.total;
    } catch (error) {
        ElMessage.error('获取项目列表失败');
        console.error(error);
    } finally {
        loading.value = false;
    }
};

// 搜索处理
const handleSearch = () => {
    currentPage.value = 1;
    fetchProjects();
};

// 重置搜索
const resetSearch = () => {
    searchForm.value = {
        projectName: '',
        dateRange: []
    };
    currentPage.value = 1;
    fetchProjects();
};

// 分页处理
const handleSizeChange = (val) => {
    pageSize.value = val;
    fetchProjects();
};

const handleCurrentChange = (val) => {
    currentPage.value = val;
    fetchProjects();
};

// 跳转到测试用例
const goToTestCases = (project) => {
    router.push({
        name: 'TestCases',
        params: { projectId: project.project_id }
    });
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
    fetchProjects();
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

.search-area {
    margin-bottom: 20px;
    padding: 20px;
    background-color: #f5f7fa;
    border-radius: 8px;
}

.project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.project-card {
    transition: all 0.3s ease;
    height: 100%;
}

.project-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.project-card-header {
    background-color: #f5f7fa;
    padding: 15px;
    border-bottom: 1px solid #ebeef5;
}

.project-id {
    color: #909399;
    font-size: 0.9em;
    margin-right: 10px;
}

.project-card-content {
    padding: 15px;
}

.description {
    color: #606266;
    margin-bottom: 15px;
    min-height: 40px;
}

.project-info {
    display: flex;
    gap: 15px;
    color: #909399;
    font-size: 0.9em;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 5px;
}

.project-card-actions {
    padding: 15px;
    border-top: 1px solid #ebeef5;
    display: flex;
    justify-content: flex-end;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

:deep(.el-card__body) {
    padding: 0 !important;
}
</style>