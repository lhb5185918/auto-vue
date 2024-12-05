<template>
  <Home>
    <PageContainer title="项目管理">
      <template #actions>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>新建项目
        </el-button>
      </template>

      <!-- 搜索区域 -->
      <el-card class="search-card" shadow="never">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="项目名称">
            <el-input
              v-model="searchForm.projectName"
              placeholder="请输入项目名称"
              clearable
              prefix-icon="Search"
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
              :shortcuts="dateShortcuts"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 项目列表展示 -->
      <div class="project-grid">
        <el-card 
          v-for="project in projects" 
          :key="project.project_id" 
          class="project-card hover-shadow"
          :body-style="{ padding: '0px' }"
        >
          <div class="project-card-header">
            <el-tag size="small" type="info" class="project-id">
              #{{ project.project_id }}
            </el-tag>
            <h3 class="project-name">{{ project.project_name }}</h3>
          </div>
          <div class="project-card-content">
            <p class="description">{{ project.description || '暂无描述' }}</p>
            <div class="project-info">
              <div class="info-item">
                <el-icon><Calendar /></el-icon>
                <span>创建：{{ formatDate(project.create_time) }}</span>
              </div>
              <div class="info-item">
                <el-icon><Timer /></el-icon>
                <span>更新：{{ formatDate(project.update_time) }}</span>
              </div>
            </div>
            <div class="project-stats">
              <div class="stat-item">
                <span class="label">测试用例</span>
                <span class="value">125</span>
              </div>
              <div class="stat-item">
                <span class="label">执行次数</span>
                <span class="value">368</span>
              </div>
              <div class="stat-item">
                <span class="label">成功率</span>
                <span class="value success">98.5%</span>
              </div>
            </div>
          </div>
          <div class="project-card-actions">
            <div class="action-buttons">
              <el-tooltip content="查看测试用例" placement="top">
                <el-button type="primary" circle @click="goToTestCases(project)">
                  <el-icon><Document /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="编辑项目" placement="top">
                <el-button circle @click="editProject(project)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除项目" placement="top">
                <el-button type="danger" circle @click="deleteProject(project)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 分页器 -->
      <div class="pagination-container">
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
        width="500px"
        destroy-on-close
      >
        <el-form 
          :model="projectForm" 
          :rules="rules" 
          ref="projectFormRef" 
          label-width="100px"
          class="project-form"
        >
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
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Calendar, Timer, Document, Edit, Delete, Plus } from '@element-plus/icons-vue';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';

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
        { required: true, message: '请输���项目名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    description: [
        { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
    ]
};

// 在 script setup 中添加默认项目数据
const defaultProjects = [
    {
        project_id: 1,
        project_name: "自动化测试平台演示项目",
        description: "这是一个演示项目，用于展示自动化测试平台的功能和特性。包含接口测试、UI测试和性能测试用例。",
        create_time: "2024-01-15T08:00:00",
        update_time: "2024-01-16T15:30:00"
    },
    {
        project_id: 2,
        project_name: "电商系统测试项目",
        description: "电商系统的自动化测试项目，覆盖下单、支付、物流等核心业务流程的自动化测试。",
        create_time: "2024-01-10T09:00:00",
        update_time: "2024-01-15T14:20:00"
    },
    {
        project_id: 3,
        project_name: "CRM系统测试",
        description: "客户关系管理系统的测试项目，包含客户管理、订单管理、报表统计等功能的自动化测试脚本。",
        create_time: "2024-01-05T10:30:00",
        update_time: "2024-01-14T16:45:00"
    },
    {
        project_id: 4,
        project_name: "移动APP测试",
        description: "移动应用的UI自动化测试项目，覆盖Android和iOS平台的主要功能测试。",
        create_time: "2024-01-01T11:00:00",
        update_time: "2024-01-13T17:15:00"
    }
];

// 修改 fetchProjects 方法
const fetchProjects = async () => {
    loading.value = true;
    try {
        // 使用默认数据替代接口调用
        projects.value = defaultProjects;
        total.value = defaultProjects.length;
        
        /* 注释掉原有的接口调用代码
        let url = `http://localhost:8000/api/project/?page=${currentPage.value}&size=${pageSize.value}`;
        
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
        */
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
.search-card {
  margin-bottom: 20px;
  background-color: var(--bg-light);
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
  margin-bottom: 20px;
}

.project-card {
  height: 100%;
  transition: all 0.3s ease;
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.project-card-header {
  background-color: var(--bg-light);
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.project-id {
  margin-bottom: 12px;
  font-size: 12px;
}

.project-name {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
  font-weight: 600;
}

.project-card-content {
  padding: 20px;
}

.description {
  color: var(--text-regular);
  margin-bottom: 20px;
  min-height: 40px;
  line-height: 1.6;
  font-size: 14px;
}

.project-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  padding: 0 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 13px;
}

.project-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px 10px;
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  background-color: var(--bg-light);
  align-items: center;
  justify-content: center;
}

.stat-item {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.stat-item .label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  text-align: center;
}

.stat-item .value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  line-height: 1;
}

.stat-item .value.success {
  color: var(--success-color);
}

.project-card-actions {
  padding: 20px;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: center;
  background-color: var(--bg-light);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-buttons .el-button {
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 确保图标在按钮中居中 */
.action-buttons .el-button .el-icon {
  margin: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 按钮悬浮效果 */
.el-button.is-circle {
  transition: all 0.3s ease;
  width: 32px;
  height: 32px;
  padding: 0;
}

.el-button.is-circle:hover {
  transform: scale(1.1);
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-card__body) {
  padding: 0 !important;
}
</style>