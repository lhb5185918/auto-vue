<template>
  <Home>
    <PageContainer title="知识库管理">
      <el-card class="knowledge-base-card">
        <el-tabs v-model="activeTab">
          <!-- 知识库列表 -->
          <el-tab-pane label="知识库列表" name="list">
            <div class="toolbar">
              <el-button type="primary" @click="openCreateDialog">
                <el-icon><Plus /></el-icon>创建知识库
              </el-button>
              <el-button type="info" @click="openConfigDialog">
                <el-icon><Setting /></el-icon>配置
              </el-button>
              <el-select
                v-model="currentProjectId"
                placeholder="选择项目"
                style="margin-right: 10px; width: 180px;"
                @change="handleProjectChange"
              >
                <el-option
                  v-for="item in projectList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索知识库"
                class="search-input"
                clearable
                @clear="fetchKnowledgeList"
                @keyup.enter="searchKnowledge"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>

            <!-- 将表格改为卡片布局 -->
            <div v-loading="tableLoading" class="knowledge-cards-container">
              <el-empty v-if="knowledgeList.length === 0" description="暂无知识库数据" />
              
              <div v-else class="knowledge-cards">
                <el-card 
                  v-for="item in knowledgeList" 
                  :key="item.rag_id" 
                  class="knowledge-card"
                  shadow="hover"
                >
                  <div class="knowledge-card-header">
                    <div class="knowledge-card-title">
                      <el-icon><Collection /></el-icon>
                      <span class="clickable-title" @click="viewKnowledge(item)">{{ item.name }}</span>
                    </div>
                    <el-tag size="small" effect="plain">{{ item.status }}</el-tag>
                  </div>
                  
                  <div class="knowledge-card-content">
                    <div class="knowledge-card-info">
                      <div class="info-item">
                        <div class="info-label">项目:</div>
                        <div class="info-value">{{ item.project_name }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">空间ID:</div>
                        <div class="info-value">{{ item.space_id }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">格式类型:</div>
                        <div class="info-value">{{ item.format_type === 0 ? '文本类型' : '图片类型' }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">数据集ID:</div>
                        <div class="info-value">{{ item.external_dataset_id }}</div>
                      </div>
                    </div>
                    
                    <div class="knowledge-card-stats">
                      <div class="knowledge-card-stat">
                        <el-icon><User /></el-icon>
                        <span>{{ item.creator }}</span>
                      </div>
                      <div class="knowledge-card-stat">
                        <el-icon><Timer /></el-icon>
                        <span>{{ item.create_time }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="knowledge-card-footer">
                    <el-button-group>
                      <el-button type="primary" size="small" @click="viewKnowledge(item)">查看</el-button>
                      <el-button type="success" size="small" @click="editKnowledge(item)">编辑</el-button>
                      <el-button type="danger" size="small" @click="deleteKnowledge(item)">删除</el-button>
                    </el-button-group>
                  </div>
                </el-card>
              </div>
            </div>

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
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </PageContainer>

    <!-- 创建/编辑知识库对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '创建知识库' : '编辑知识库'"
      width="50%"
    >
      <el-form
        :model="knowledgeForm"
        :rules="knowledgeRules"
        ref="knowledgeFormRef"
        label-width="120px"
      >
        <el-form-item label="知识库名称" prop="title">
          <el-input v-model="knowledgeForm.title" placeholder="请输入知识库名称" />
        </el-form-item>
        <el-form-item label="Space ID" prop="space_id">
          <el-select 
            v-model="knowledgeForm.space_id" 
            placeholder="请选择空间" 
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="item in workspaces"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
              <div class="workspace-option">
                <el-avatar :size="24" :src="item.icon_url" />
                <span class="workspace-name">{{ item.name }}</span>
                <span class="workspace-id">(ID: {{ item.id }})</span>
              </div>
            </el-option>
          </el-select>
          <div class="form-help">知识库所在的空间ID，Space ID 是空间的唯一标识</div>
        </el-form-item>
        <el-form-item label="知识库格式" prop="format_type">
          <el-radio-group v-model="knowledgeForm.format_type">
            <el-radio :label="0">文本类型</el-radio>
            <el-radio :label="2">图片类型</el-radio>
          </el-radio-group>
          <div class="form-help">选择知识库的内容格式类型</div>
        </el-form-item>
        <el-form-item label="知识库分类" prop="category">
          <el-select v-model="knowledgeForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="knowledgeForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入知识库描述"
          />
        </el-form-item>
        <el-form-item label="文件ID" prop="file_id" v-if="knowledgeForm.format_type === 2">
          <el-input 
            v-model="knowledgeForm.file_id" 
            placeholder="图片类型知识库需提供file_id"
          />
          <div class="form-help">知识库图标，应传入上传文件接口中获取的 file_id</div>
        </el-form-item>
        <el-form-item label="标签">
          <el-tag
            v-for="tag in knowledgeForm.tags"
            :key="tag"
            closable
            @close="handleTagClose(tag)"
            style="margin-right: 8px; margin-bottom: 8px"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="tagInputVisible"
            ref="tagInputRef"
            v-model="tagInputValue"
            class="tag-input"
            size="small"
            @keyup.enter="handleTagConfirm"
            @blur="handleTagConfirm"
          />
          <el-button v-else class="tag-add-button" size="small" @click="showTagInput">
            <el-icon><Plus /></el-icon> 添加标签
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveKnowledge">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 配置弹窗 -->
    <el-dialog
      v-model="configDialogVisible"
      title="知识库API配置"
      width="40%"
    >
      <el-form
        :model="configForm"
        :rules="configRules"
        ref="configFormRef"
        label-width="120px"
      >
        <el-form-item label="API密钥" prop="apiKey">
          <el-input 
            v-model="configForm.apiKey" 
            placeholder="请输入API密钥"
            show-password
          />
          <div class="form-help">API密钥用于访问知识库服务，请妥善保管</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="configDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveConfig">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </Home>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as echarts from 'echarts';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import request from '@/utils/request';
import { 
  Plus, 
  Search, 
  Collection, 
  Document, 
  Fold, 
  PriceTag,
  Setting,
  Timer,
  User
} from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 当前选中的标签页
const activeTab = ref('list');

// 知识库列表相关
const tableLoading = ref(false);
const knowledgeList = ref([]);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const currentProjectId = ref(null);
const projectList = ref([]);

// 图表引用
let categoryChart = null;
let activityChart = null;

// 对话框相关
const dialogVisible = ref(false);
const dialogType = ref('create'); // 'create' 或 'edit'
const knowledgeFormRef = ref(null);
const knowledgeForm = ref({
  id: '',
  title: '',
  description: '',
  category: '',
  space_id: '',
  format_type: 0,
  file_id: '',
  tags: []
});

const knowledgeRules = {
  title: [
    { required: true, message: '请输入知识库名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符之间', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择知识库分类', trigger: 'change' }
  ],
  space_id: [
    { required: true, message: '请输入Space ID', trigger: 'blur' }
  ],
  format_type: [
    { required: true, message: '请选择知识库格式', trigger: 'change' }
  ]
};

// 标签输入相关
const tagInputVisible = ref(false);
const tagInputValue = ref('');
const tagInputRef = ref(null);

// 分类选项
const categoryOptions = ref([
  { value: 'technical', label: '技术文档' },
  { value: 'business', label: '业务知识' },
  { value: 'product', label: '产品文档' },
  { value: 'testing', label: '测试知识' },
  { value: 'other', label: '其他' }
]);

// 配置弹窗相关
const configDialogVisible = ref(false);
const configFormRef = ref(null);
const configForm = ref({
  apiKey: '',
  ragId: null,
  global: true
});

// 全局配置状态
const globalConfig = ref({
  hasApiKey: false
});

const configRules = {
  apiKey: [
    { required: true, message: '请输入API密钥', trigger: 'blur' }
  ]
};

// 空间列表
const workspaces = ref([]);

// 获取空间列表
const fetchWorkspaces = async () => {
  try {
    const response = await request.get('/api/rag/workspaces');
    if (response.data.code === 0) { // 注意这里code是0
      workspaces.value = response.data.data.workspaces || [];
      // 如果有空间且表单中未选择，则默认选择第一个
      if (workspaces.value.length > 0 && !knowledgeForm.value.space_id) {
        knowledgeForm.value.space_id = workspaces.value[0].id;
      }
    } else {
      throw new Error(response.data.msg || '获取空间列表失败');
    }
  } catch (error) {
    console.error('获取空间列表失败:', error);
    ElMessage.error('获取空间列表失败');
  }
};

// 获取项目列表
const fetchProjects = async () => {
  try {
    const response = await request.get('/api/project/');
    
    if (response.data.code === 200) {
      projectList.value = response.data.data.projects || [];
      // 如果有项目，默认选择第一个
      if (projectList.value.length > 0) {
        currentProjectId.value = projectList.value[0].id;
        fetchKnowledgeList();
      }
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('获取项目列表失败:', error);
    ElMessage.error('获取项目列表失败');
  }
};

// 项目变更处理
const handleProjectChange = () => {
  currentPage.value = 1;
  fetchKnowledgeList();
};

// 获取知识库列表
const fetchKnowledgeList = async () => {
  if (!currentProjectId.value) {
    ElMessage.warning('请先选择项目');
    return;
  }

  tableLoading.value = true;
  try {
    const response = await request.get(`/api/rag/list/${currentProjectId.value}`, {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: searchKeyword.value,
        project_id: currentProjectId.value
      }
    });
    
    if (response.data.code === 200) {
      knowledgeList.value = response.data.data.list;
      total.value = response.data.data.total;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('获取知识库列表失败:', error);
    ElMessage.error('获取知识库列表失败');
  } finally {
    tableLoading.value = false;
  }
};

// 搜索知识库
const searchKnowledge = () => {
  currentPage.value = 1;
  fetchKnowledgeList();
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchKnowledgeList();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchKnowledgeList();
};

// 知识库操作
const viewKnowledge = (row) => {
  // 跳转到知识库详情页
  console.log('查看知识库:', row);
  router.push({
    name: 'KnowledgeUpload',
    query: {
      id: row.rag_id,
      name: row.name,
      spaceId: row.space_id,
      formatType: row.format_type,
      datasetId: row.external_dataset_id
    }
  });
};

// 显示创建对话框
const openCreateDialog = async () => {
  // 检查是否已配置API密钥
  if (!globalConfig.value.hasApiKey) {
    await ElMessageBox.confirm(
      '创建知识库前需要先配置API密钥',
      '提示',
      {
        confirmButtonText: '去配置',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      openConfigDialog();
    }).catch(() => {});
    
    return;
  }
  
  dialogType.value = 'create';
  knowledgeForm.value = {
    id: '',
    title: '',
    description: '',
    category: '',
    space_id: '',
    format_type: 0,
    file_id: '',
    tags: []
  };
  
  // 获取可用空间列表
  await fetchWorkspaces();
  
  dialogVisible.value = true;
};

// 编辑知识库
const editKnowledge = async (row) => {
  dialogType.value = 'edit';
  knowledgeForm.value = {
    id: row.rag_id,
    title: row.name,
    description: '',
    category: '',
    space_id: row.space_id || '',
    format_type: row.format_type || 0,
    file_id: '',
    tags: []
  };
  
  // 获取可用空间列表
  await fetchWorkspaces();
  
  dialogVisible.value = true;
};

const saveKnowledge = async () => {
  if (!knowledgeFormRef.value) return;
  
  await knowledgeFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let response;
        const formData = { ...knowledgeForm.value, project_id: currentProjectId.value };
        
        if (dialogType.value === 'create') {
          response = await request.post('/api/rag/', formData);
        } else {
          response = await request.put(`/api/rag/${formData.id}`, formData);
        }
        
        if (response.data.code === 200) {
          ElMessage.success(dialogType.value === 'create' ? '知识库创建成功' : '知识库更新成功');
          dialogVisible.value = false;
          fetchKnowledgeList();
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error(dialogType.value === 'create' ? '创建知识库失败:' : '更新知识库失败:', error);
        ElMessage.error(dialogType.value === 'create' ? '创建知识库失败' : '更新知识库失败');
      }
    }
  });
};

const deleteKnowledge = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除知识库 "${row.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const response = await request.delete(`/api/rag/${row.rag_id}`);
    
    if (response.data.code === 200) {
      ElMessage.success('知识库删除成功');
      fetchKnowledgeList();
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除知识库失败:', error);
      ElMessage.error(error.message || '删除知识库失败');
    }
  }
};

// 标签操作
const showTagInput = () => {
  tagInputVisible.value = true;
  nextTick(() => {
    tagInputRef.value?.focus();
  });
};

const handleTagClose = (tag) => {
  knowledgeForm.value.tags = knowledgeForm.value.tags.filter(t => t !== tag);
};

const handleTagConfirm = () => {
  if (tagInputValue.value) {
    if (!knowledgeForm.value.tags.includes(tagInputValue.value)) {
      knowledgeForm.value.tags.push(tagInputValue.value);
    }
  }
  tagInputVisible.value = false;
  tagInputValue.value = '';
};

// 获取全局API配置状态
const fetchGlobalApiConfig = async () => {
  try {
    const response = await request.get('/api/rag/config');
    
    if (response.data.code === 200) {
      globalConfig.value.hasApiKey = !!response.data.data.apiKey;
      if (response.data.data.apiKey) {
        configForm.value.apiKey = response.data.data.apiKey;
      }
    }
  } catch (error) {
    console.error('获取API配置状态失败:', error);
    ElMessage.warning('未检测到API密钥配置');
    globalConfig.value.hasApiKey = false;
  }
};

// 打开配置弹窗
const openConfigDialog = async () => {
  configForm.value.global = true; // 默认为全局配置
  configForm.value.ragId = null;
  
  try {
    // 获取全局配置
    const response = await request.get('/api/rag/config');
    if (response.data.code === 200) {
      configForm.value.apiKey = response.data.data.apiKey || '';
    }
  } catch (error) {
    console.error('获取配置信息失败:', error);
  }
  
  configDialogVisible.value = true;
};

// 保存配置
const saveConfig = async () => {
  if (!configFormRef.value) return;
  
  await configFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let response;
        
        if (configForm.value.global) {
          // 保存全局API密钥
          response = await request.post('/api/rag/config', {
            apiKey: configForm.value.apiKey
          });
        } else if (configForm.value.ragId) {
          // 如果当前有选择的知识库，则更新该知识库的key
          response = await request.patch(`/api/rag/update_key/${configForm.value.ragId}`, {
            apiKey: configForm.value.apiKey
          });
        } else {
          ElMessage.warning('请先选择要配置的知识库');
          return;
        }
        
        if (response.data.code === 200) {
          ElMessage.success('API密钥保存成功');
          configDialogVisible.value = false;
          
          // 更新全局配置状态
          if (configForm.value.global) {
            globalConfig.value.hasApiKey = true;
          }
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error('保存配置失败:', error);
        ElMessage.error(error.message || '保存配置失败');
      }
    }
  });
};

onMounted(() => {
  fetchProjects(); // 先获取项目列表
  fetchGlobalApiConfig(); // 获取API配置状态
  
  // 监听标签页切换
  watch(activeTab, (newTab) => {
    // 这里不需要处理标签页切换，因为已经删除了统计分析Tab
  });
  
  nextTick(() => {
    // 初始化图表
    // 这里不需要初始化图表，因为已经删除了统计分析Tab
  });
});

// 组件卸载时移除监听器
onUnmounted(() => {
  if (categoryChart) categoryChart.dispose();
  if (activityChart) activityChart.dispose();
});
</script>

<style scoped>
.knowledge-base-card {
  margin: 0 auto;
  max-width: 1200px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.knowledge-base-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.toolbar .el-button {
  margin-right: 12px;
  border-radius: 6px;
  transition: all 0.3s;
}

.toolbar .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-input {
  width: 280px;
  margin-left: auto;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.knowledge-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #409EFF;
}

.knowledge-title .el-icon {
  color: #409EFF;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

:deep(.el-table th) {
  background-color: #f7f8fa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-table__row) {
  transition: all 0.2s;
}

:deep(.el-table__row:hover) {
  background-color: #f0f7ff !important;
}

:deep(.el-button-group .el-button) {
  border-radius: 4px;
  margin: 0 4px;
}

.pagination-container {
  margin-top: 25px;
  display: flex;
  justify-content: center;
  padding: 10px 0;
}

:deep(.el-pagination) {
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 知识库卡片布局样式 */
.knowledge-cards-container {
  min-height: 300px;
}

.knowledge-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.knowledge-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  transition: all 0.3s;
  border: none;
}

.knowledge-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1) !important;
}

.knowledge-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.knowledge-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #409EFF;
}

.knowledge-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.knowledge-card-desc {
  margin: 0 0 16px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.knowledge-card-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.knowledge-card-stat {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
  font-size: 13px;
}

.knowledge-card-stat .el-icon {
  font-size: 14px;
}

.knowledge-card-footer {
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

/* 添加样式 */
.workspace-option {
  display: flex;
  align-items: center;
  padding: 5px 0;
}

.workspace-name {
  margin-left: 10px;
  font-weight: 500;
}

.workspace-id {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.knowledge-card-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
  flex: 1;
}

.info-item {
  display: flex;
  line-height: 1.5;
}

.info-label {
  color: #606266;
  font-size: 13px;
  font-weight: 500;
  width: 80px;
}

.info-value {
  color: #303133;
  font-size: 13px;
  word-break: break-all;
}

.clickable-title {
  cursor: pointer;
  color: #409EFF;
  transition: color 0.3s;
}

.clickable-title:hover {
  color: #66b1ff;
  text-decoration: underline;
}
</style> 