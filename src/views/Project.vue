<template>
  <Home>
    <PageContainer title="项目列表">
      <template #actions>
        <el-button type="primary" @click="createProject">
          <el-icon><Plus /></el-icon>创建项目
        </el-button>
      </template>
      
      <div class="project-list" v-loading="loading">
        <!-- 使用网格布局替代表格 -->
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="project in projects" :key="project.id">
            <el-card class="project-card" shadow="hover">
              <!-- 项目状态标签 -->
              <div class="status-tag">
                <el-tag :type="project.status === 0 ? 'success' : 'info'">
                  {{ project.status === 0 ? '活跃' : '未活跃' }}
                </el-tag>
              </div>
              
              <!-- 项目基本信息 -->
              <h3 class="project-name" @click="viewProject(project)">{{ project.name }}</h3>
              <p class="project-desc">{{ project.description || '暂无描述' }}</p>
              
              <!-- 项目统计信息 -->
              <div class="project-stats">
                <div class="stat-item">
                  <el-icon><Document /></el-icon>
                  <span>{{ project.test_cases_count || 0 }} 个测试用例</span>
                </div>
                <div class="stat-item">
                  <el-icon><User /></el-icon>
                  <span>{{ project.creator?.username }}</span>
                </div>
                <div class="stat-item">
                  <el-icon><Timer /></el-icon>
                  <span>{{ formatDate(project.create_time) }}</span>
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="project-actions">
                <el-button-group class="action-group">
                  <el-button size="small" @click="viewProject(project)">
                    <el-icon><View /></el-icon>
                    查看
                  </el-button>
                  <el-button size="small" type="primary" @click="editProject(project)">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <el-button size="small" type="danger" @click="deleteProject(project)">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </el-button-group>
                
                <!-- 添加测试用例按钮 -->
                <el-button 
                  class="test-cases-btn"
                  type="success" 
                  size="small" 
                  @click="goToTestCases(project)"
                >
                  <el-icon><Collection /></el-icon>
                  测试用例
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 分页器 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[12, 24, 36, 48]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
      
      <!-- 添加项目详情弹窗 -->
      <el-dialog
        v-model="dialogVisible"
        title="项目详情"
        width="600px"
        :close-on-click-modal="false"
      >
        <div class="project-detail">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="项目名称">
              {{ currentProject.name }}
            </el-descriptions-item>
            <el-descriptions-item label="项目描述">
              {{ currentProject.description }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDate(currentProject.create_time) }}
            </el-descriptions-item>
            <el-descriptions-item label="创建人">
              {{ currentProject.creator?.username }}
            </el-descriptions-item>
            <el-descriptions-item label="测试用例数">
              {{ currentProject.test_cases_count || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="最后执行时间">
              {{ currentProject.last_execution_time ? formatDate(currentProject.last_execution_time) : '暂无执行记录' }}
            </el-descriptions-item>
            <el-descriptions-item label="项目状态">
              <el-tag :type="currentProject.status === 0 ? 'success' : 'info'">
                {{ currentProject.status === 0 ? '活跃' : '未活跃' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">关闭</el-button>
            <el-button type="primary" @click="goToTestCases(currentProject)">
              查看用例
            </el-button>
          </span>
        </template>
      </el-dialog>
      
      <!-- 添加编辑项目弹窗 -->
      <el-dialog
        v-model="editDialogVisible"
        title="编辑项目"
        width="500px"
        :close-on-click-modal="false"
      >
        <el-form
          ref="editFormRef"
          :model="editForm"
          :rules="formRules"
          label-width="100px"
          status-icon
        >
          <el-form-item label="项目名称" prop="name">
            <el-input v-model="editForm.name" placeholder="请输入项目名称" />
          </el-form-item>
          <el-form-item label="项目描述" prop="description">
            <el-input
              v-model="editForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入项目描述"
            />
          </el-form-item>
          <el-form-item label="项目状态" prop="status">
            <el-select v-model="editForm.status" placeholder="请选择项目状态" style="width: 100%">
              <el-option label="活跃" :value="0" />
              <el-option label="未活跃" :value="1" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="editDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="submitting" @click="submitEdit">
              确定
            </el-button>
          </span>
        </template>
      </el-dialog>
      
      <!-- 添加创建项目弹窗 -->
      <el-dialog
        v-model="createDialogVisible"
        title="创建项目"
        width="500px"
        :close-on-click-modal="false"
      >
        <el-form
          ref="createFormRef"
          :model="createForm"
          :rules="formRules"
          label-width="100px"
          status-icon
        >
          <el-form-item label="项目名称" prop="name">
            <el-input v-model="createForm.name" placeholder="请输入项目名称" />
          </el-form-item>
          <el-form-item label="项目描述" prop="description">
            <el-input
              v-model="createForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入项目描述"
            />
          </el-form-item>
          <el-form-item label="项目状态" prop="status">
            <el-select v-model="createForm.status" placeholder="请选择项目状态" style="width: 100%">
              <el-option label="活跃" :value="0" />
              <el-option label="未活跃" :value="1" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="createDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="submitting" @click="submitCreate">
              创建
            </el-button>
          </span>
        </template>
      </el-dialog>
      
      <!-- 修改删除确认弹窗 -->
      <el-dialog
        v-model="deleteDialogVisible"
        width="400px"
        :close-on-click-modal="false"
        :show-close="false"
        class="delete-dialog"
      >
        <template #header>
          <div class="dialog-header">
            <el-icon class="header-icon"><WarningFilled /></el-icon>
            <span>删除确认</span>
          </div>
        </template>
        <div class="delete-confirm">
          <p class="delete-content">确定要删除项目 "<span class="project-name">{{ projectToDelete?.name }}</span>" 吗？</p>
          <p class="warning-text">
            <el-icon><InfoFilled /></el-icon>
            此操作不可恢复，请谨��操作！
          </p>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="deleteDialogVisible = false">取 消</el-button>
            <el-button type="danger" @click="confirmDelete" :loading="submitting">
              确认删除
            </el-button>
          </span>
        </template>
      </el-dialog>
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import { Plus, WarningFilled, InfoFilled, Document, User, Timer, View, Edit, Delete, Collection } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const projects = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const currentProject = ref({});
const router = useRouter();

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取项目列表
const getProjects = async () => {
  loading.value = true;
  try {
    const response = await axios.post('http://localhost:8081/api/project/', 
      {
        page: currentPage.value,
        page_size: pageSize.value
      },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 200) {
      projects.value = response.data.data.projects;
      total.value = response.data.data.total;
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    console.error('获取项目列表失败:', error);
    if (error.response && error.response.data) {
      ElMessage.error(error.response.data.message);
    } else {
      ElMessage.error('获取项目列表失败，请检查网络连接');
    }
  } finally {
    loading.value = false;
  }
};

// 处理每页显示数量变化
const handleSizeChange = (val) => {
  pageSize.value = val;
  getProjects();
};

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val;
  getProjects();
};

// 查看项目
const viewProject = (project) => {
  currentProject.value = project;
  dialogVisible.value = true;
};

// 编辑项目
const editProject = (project) => {
  editForm.value = {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status === 'active' ? 0 : 1
  };
  editDialogVisible.value = true;
};

// 删除项目
const deleteProject = (project) => {
  projectToDelete.value = project;
  deleteDialogVisible.value = true;
};

// 创建项目
const createProject = () => {
  createForm.value = {
    name: '',
    description: '',
    status: 0
  };
  createDialogVisible.value = true;
};

// 在项目列表页添加跳转方法
const goToTestCases = (project) => {
  router.push({
    name: 'TestCases',
    query: {
      projectId: project.id,
      projectName: project.name || '未知项目'
    }
  });
};

// 添加新的响应式变量
const editDialogVisible = ref(false);
const editFormRef = ref(null);
const submitting = ref(false);
const editForm = ref({
  id: '',
  name: '',
  description: '',
  status: 0
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入项目描述', trigger: 'blur' },
    { max: 500, message: '长度不能超过 500 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择项目状态', trigger: 'change' }
  ]
};

// 提交编辑
const submitEdit = async () => {
  if (!editFormRef.value) return;
  
  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        const response = await axios.post(
          `http://localhost:8081/api/project/edit/`,
          editForm.value,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.code === 200) {
          ElMessage.success('项目更新成功');
          editDialogVisible.value = false;
          getProjects(); // 刷新项目列表
        } else {
          ElMessage.error(response.data.message);
        }
      } catch (error) {
        console.error('更新项目失败:', error);
        if (error.response && error.response.data) {
          ElMessage.error(error.response.data.message);
        } else {
          ElMessage.error('更新项目失败，请检查网络连接');
        }
      } finally {
        submitting.value = false;
      }
    }
  });
};

// 添加新的响应式变量
const createDialogVisible = ref(false);
const createFormRef = ref(null);
const createForm = ref({
  name: '',
  description: '',
  status: 0
});

// 提交创建
const submitCreate = async () => {
  if (!createFormRef.value) return;
  
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        const response = await axios.post(
          'http://localhost:8081/api/project/create/',
          createForm.value,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.code === 200) {
          ElMessage.success('项目创建成功');
          createDialogVisible.value = false;
          getProjects(); // 刷新项目列表
        } else {
          ElMessage.error(response.data.message);
        }
      } catch (error) {
        console.error('创建项目失败:', error);
        if (error.response && error.response.data) {
          ElMessage.error(error.response.data.message);
        } else {
          ElMessage.error('创建项目失败，请检查网络连接');
        }
      } finally {
        submitting.value = false;
      }
    }
  });
};

// 添加新的响应式变量
const deleteDialogVisible = ref(false);
const projectToDelete = ref(null);

// 添加确认删除方法
const confirmDelete = async () => {
  if (!projectToDelete.value) return;
  
  try {
    const response = await axios.post(
      'http://localhost:8081/api/project/delete/',
      { id: projectToDelete.value.id },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 200) {
      ElMessage.success('项目删除成功');
      deleteDialogVisible.value = false;
      getProjects(); // 刷新项目列表
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    console.error('删除项目失败:', error);
    if (error.response && error.response.data) {
      ElMessage.error(error.response.data.message);
    } else {
      ElMessage.error('删除项目失败，请检查网络连接');
    }
  }
};

// 处理测试用例按钮点击
const handleTestCase = (row) => {
  router.push({
    path: '/test-cases',
    query: {
      projectId: row.id
    }
  })
}

onMounted(() => {
  getProjects();
});
</script>

<style scoped>
.project-list {
  padding: 20px;
}

.project-card {
  height: 100%;
  margin-bottom: 20px;
  position: relative;
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.status-tag {
  position: absolute;
  top: 12px;
  right: 12px;
}

.project-name {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  cursor: pointer;
}

.project-name:hover {
  color: var(--el-color-primary);
}

.project-desc {
  margin: 0 0 16px;
  font-size: 14px;
  color: #606266;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.project-stats {
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #909399;
  font-size: 13px;
}

.stat-item .el-icon {
  font-size: 16px;
}

.project-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.action-group {
  display: flex;
  gap: 8px;
}

.test-cases-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

:deep(.el-button-group .el-button) {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.el-button .el-icon) {
  margin: 0;
}

.pagination {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

/* 调整分页器每页显示数量 */
:deep(.el-pagination) {
  --el-pagination-button-size: 32px;
}

/* 响应式布局调整 */
@media (max-width: 768px) {
  .project-card {
    margin-bottom: 16px;
  }
  
  .project-name {
    font-size: 16px;
  }
  
  .project-desc {
    height: 36px;
  }
}

.project-detail {
  padding: 20px 0;
}

:deep(.el-descriptions__label) {
  width: 120px;
  justify-content: flex-end;
}

:deep(.el-descriptions__content) {
  padding: 12px 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  box-shadow: none;
  border: 1px solid #dcdfe6;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  border-color: #409eff;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 1px #409eff;
}

.delete-confirm {
  text-align: center;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.warning-icon {
  font-size: 48px;
  color: #f56c6c;
  margin-bottom: 8px;
}

.delete-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.delete-content {
  font-size: 16px;
  color: #606266;
  margin: 0;
}

.project-name {
  color: #f56c6c;
  font-weight: 600;
}

.warning-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f56c6c;
  font-size: 14px;
  margin: 0;
  background-color: #fef0f0;
  padding: 8px 16px;
  border-radius: 4px;
}

.warning-text .el-icon {
  font-size: 16px;
}

:deep(.delete-dialog .el-dialog__header) {
  display: none;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 8px;
}

:deep(.el-button--danger) {
  --el-button-hover-bg-color: #f56c6c;
  --el-button-hover-border-color: #f56c6c;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-icon {
  color: #f56c6c;
  font-size: 20px;
}

:deep(.delete-dialog .el-dialog__header) {
  padding: 20px;
  margin-right: 0;
  border-bottom: 1px solid #dcdfe6;
}

.delete-confirm {
  text-align: center;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
</style>