<template>
  <Home>
    <PageContainer title="项目列表">
      <template #actions>
        <el-button type="primary" @click="createProject">
          <el-icon><Plus /></el-icon>创建项目
        </el-button>
      </template>
      
      <div class="project-list">
        <el-table :data="projects" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="项目名称" />
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
          <el-table-column prop="creator.username" label="创建者" />
          <el-table-column label="创建时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.create_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
                {{ scope.row.status === 1 ? '活跃' : '未活跃' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="viewProject(scope.row)">查看</el-button>
              <el-button size="small" type="primary" @click="editProject(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteProject(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        
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
            <el-descriptions-item label="项目名��">
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
              <el-tag :type="currentProject.status === 1 ? 'success' : 'info'">
                {{ currentProject.status === 1 ? '活跃' : '未活跃' }}
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
              <el-option label="活跃" :value="1" />
              <el-option label="未活跃" :value="0" />
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
              <el-option label="活跃" :value="1" />
              <el-option label="未活跃" :value="0" />
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
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import { Plus } from '@element-plus/icons-vue';
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
    status: project.status
  };
  editDialogVisible.value = true;
};

// 删除项目
const deleteProject = (project) => {
  console.log('删除项目:', project);
};

// 创建项目
const createProject = () => {
  createForm.value = {
    name: '',
    description: '',
    status: 1
  };
  createDialogVisible.value = true;
};

// 添加跳转到测试用例页面的方法
const goToTestCases = (project) => {
  dialogVisible.value = false;
  router.push({
    path: '/testcases',
    query: { projectId: project.id }
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
  status: 1
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
        const response = await axios.put(
          `http://localhost:8081/api/project/${editForm.value.id}/`,
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
  status: 1
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

onMounted(() => {
  getProjects();
});
</script>

<style scoped>
.project-list {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table) {
  margin: -12px;
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
</style>