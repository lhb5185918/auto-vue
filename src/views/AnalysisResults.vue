<template>
  <Home>
    <PageContainer title="智能测试用例生成结果">
      <div class="analysis-results-container">
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索生成结果"
            class="search-input"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <div class="action-buttons">
            <el-button type="primary" @click="refreshResults" :loading="loading">
              <el-icon><Refresh /></el-icon>刷新结果
            </el-button>
            <el-button type="success" @click="navigateToGenerate">
              <el-icon><Plus /></el-icon>生成新测试用例
            </el-button>
          </div>
        </div>
        
        <div class="filter-section">
          <el-radio-group v-model="statusFilter" size="large" @change="handleSearch">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="success">成功</el-radio-button>
            <el-radio-button label="failed">失败</el-radio-button>
            <el-radio-button label="in_progress">处理中</el-radio-button>
          </el-radio-group>
          
          <div class="date-filter">
            <span class="date-label">生成日期：</span>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleSearch"
            />
          </div>
        </div>
        
        <!-- 结果列表显示 -->
        <el-card shadow="hover" class="results-card">
          <el-table
            :data="filteredResults"
            v-loading="loading"
            style="width: 100%"
            border
            row-key="id"
          >
            <el-table-column label="ID" prop="id" width="80" align="center" />
            <el-table-column label="分析名称" prop="name" min-width="200" show-overflow-tooltip />
            <el-table-column label="生成模式" prop="mode" width="120">
              <template #default="{ row }">
                <el-tag size="small" :type="row.mode === 'ai' ? 'success' : 'primary'">
                  {{ row.mode === 'ai' ? 'AI生成' : '模板生成' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" prop="status" width="120" align="center">
              <template #default="{ row }">
                <el-tag 
                  :type="getStatusType(row.status)" 
                  size="small"
                >
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="测试用例数量" prop="test_cases_count" width="120" align="center" />
            <el-table-column label="创建时间" prop="create_time" width="180">
              <template #default="{ row }">
                {{ formatDate(row.create_time) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="250" align="center" fixed="right">
              <template #default="{ row }">
                <el-button-group>
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="viewAnalysisDetail(row)"
                    :disabled="row.status === 'in_progress'"
                  >
                    查看详情
                  </el-button>
                  <el-button 
                    type="success" 
                    size="small" 
                    @click="importTestCases(row)"
                    :disabled="row.status !== 'success'"
                  >
                    导入测试用例
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="deleteAnalysis(row)"
                  >
                    删除
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页控件 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="totalResults"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
        
        <!-- 结果详情弹窗 -->
        <el-dialog
          v-model="detailDialogVisible"
          title="分析结果详情"
          width="80%"
          :fullscreen="false"
          :close-on-click-modal="false"
          top="5vh"
          destroy-on-close
          class="detail-dialog"
        >
          <div class="detail-container" v-loading="detailLoading">
            <el-tabs v-model="activeTab">
              <el-tab-pane label="基本信息" name="info">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="分析ID">{{ currentDetail.id }}</el-descriptions-item>
                  <el-descriptions-item label="分析名称">{{ currentDetail.name }}</el-descriptions-item>
                  <el-descriptions-item label="生成模式">
                    <el-tag :type="currentDetail.mode === 'ai' ? 'success' : 'primary'">
                      {{ currentDetail.mode === 'ai' ? 'AI生成' : '模板生成' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="状态">
                    <el-tag :type="getStatusType(currentDetail.status)">
                      {{ getStatusText(currentDetail.status) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="测试用例数量">{{ currentDetail.test_cases_count }}</el-descriptions-item>
                  <el-descriptions-item label="创建时间">{{ formatDate(currentDetail.create_time) }}</el-descriptions-item>
                  <el-descriptions-item label="分析内容" :span="2">
                    <div class="analysis-summary">{{ currentDetail.summary || '无分析摘要' }}</div>
                  </el-descriptions-item>
                </el-descriptions>
              </el-tab-pane>
              
              <el-tab-pane label="测试用例列表" name="test_cases">
                <div class="test-cases-section">
                  <el-table
                    :data="currentDetail.test_cases || []"
                    style="width: 100%"
                    border
                    row-key="id"
                    max-height="500"
                  >
                    <el-table-column type="index" width="50" align="center" />
                    <el-table-column label="用例名称" prop="title" min-width="200" show-overflow-tooltip />
                    <el-table-column label="API路径" prop="api_path" min-width="180" show-overflow-tooltip />
                    <el-table-column label="请求方法" prop="method" width="100" align="center">
                      <template #default="{ row }">
                        <el-tag 
                          :type="getMethodType(row.method)" 
                          size="small"
                        >
                          {{ row.method || 'GET' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="优先级" prop="priority" width="80" align="center">
                      <template #default="{ row }">
                        <el-tag 
                          :type="getPriorityType(row.priority)" 
                          size="small"
                        >
                          {{ row.priority || '中' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150" align="center" fixed="right">
                      <template #default="{ row }">
                        <el-button 
                          type="primary" 
                          size="small" 
                          @click="viewTestCaseDetail(row)"
                        >
                          查看详情
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                  
                  <div class="import-actions">
                    <el-button 
                      type="success" 
                      @click="importAllTestCases"
                      :disabled="!currentDetail.test_cases || currentDetail.test_cases.length === 0"
                    >
                      全部导入到测试用例库
                    </el-button>
                  </div>
                </div>
              </el-tab-pane>
              
              <el-tab-pane label="原始数据" name="raw">
                <div class="raw-data-section">
                  <pre class="json-preview">{{ JSON.stringify(currentDetail, null, 2) }}</pre>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
          
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="detailDialogVisible = false">关闭</el-button>
              <el-button 
                type="primary" 
                @click="exportToExcel"
                :disabled="!currentDetail.test_cases || currentDetail.test_cases.length === 0"
              >
                导出Excel
              </el-button>
            </span>
          </template>
        </el-dialog>
        
        <!-- 测试用例详情弹窗 -->
        <el-dialog
          v-model="testCaseDialogVisible"
          title="测试用例详情"
          width="60%"
          destroy-on-close
        >
          <div class="test-case-detail" v-if="currentTestCase">
            <el-descriptions :column="1" border direction="vertical">
              <el-descriptions-item label="用例名称">{{ currentTestCase.title }}</el-descriptions-item>
              <el-descriptions-item label="API路径">{{ currentTestCase.api_path }}</el-descriptions-item>
              <el-descriptions-item label="请求方法">
                <el-tag :type="getMethodType(currentTestCase.method)">
                  {{ currentTestCase.method }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="描述">{{ currentTestCase.description || '无描述' }}</el-descriptions-item>
              <el-descriptions-item label="优先级">
                <el-tag :type="getPriorityType(currentTestCase.priority)">
                  {{ currentTestCase.priority || '中' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="请求数据">
                <pre class="code-block">{{ formatJson(currentTestCase.request_data) }}</pre>
              </el-descriptions-item>
              <el-descriptions-item label="预期响应">
                <pre class="code-block">{{ formatJson(currentTestCase.expected_response) }}</pre>
              </el-descriptions-item>
              <el-descriptions-item label="断言">
                <pre class="code-block">{{ formatJson(currentTestCase.assertions) }}</pre>
              </el-descriptions-item>
            </el-descriptions>
          </div>
          
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="testCaseDialogVisible = false">关闭</el-button>
              <el-button 
                type="primary" 
                @click="importSingleTestCase(currentTestCase)"
              >
                导入到测试用例库
              </el-button>
            </span>
          </template>
        </el-dialog>
        
        <!-- 导入进度对话框 -->
        <el-dialog
          v-model="importDialogVisible"
          title="导入测试用例"
          width="500px"
          :close-on-click-modal="false"
          center
        >
          <div class="import-progress">
            <el-progress 
              :percentage="importProgress" 
              :status="importProgress === 100 ? 'success' : ''"
              :stroke-width="20"
              :format="progressFormat"
            />
            <div class="import-status">
              {{ importStatus }}
            </div>
          </div>
          
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="importDialogVisible = false" :disabled="importing && importProgress < 100">
                {{ importProgress === 100 ? '关闭' : '取消' }}
              </el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Search, 
  Refresh, 
  Plus, 
  Download, 
  Delete,
  View,
  EditPen
} from '@element-plus/icons-vue';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import request from '@/utils/request';

// 路由
const router = useRouter();

// 是否使用模拟数据（开发测试用）
const useMockData = true;

// 数据加载状态
const loading = ref(false);
const detailLoading = ref(false);

// 分析结果列表数据
const analysisList = ref([]);
const totalResults = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 搜索和筛选
const searchQuery = ref('');
const statusFilter = ref('');
const dateRange = ref([]);

// 对话框控制
const detailDialogVisible = ref(false);
const testCaseDialogVisible = ref(false);
const importDialogVisible = ref(false);

// 当前查看的详情
const currentDetail = ref({});
const currentTestCase = ref(null);
const activeTab = ref('info');

// 导入状态
const importing = ref(false);
const importProgress = ref(0);
const importStatus = ref('准备导入...');

// 过滤后的结果列表
const filteredResults = computed(() => {
  return analysisList.value;
});

// 获取分析结果列表
const getAnalysisResults = async () => {
  loading.value = true;
  
  // 使用模拟数据（开发测试用）
  if (useMockData) {
    setTimeout(() => {
      analysisList.value = [
        {
          id: 1,
          name: '登录接口测试用例分析',
          mode: 'ai',
          status: 'success',
          test_cases_count: 5,
          create_time: new Date().toISOString()
        },
        {
          id: 2,
          name: '用户管理接口分析',
          mode: 'template',
          status: 'in_progress',
          test_cases_count: 0,
          create_time: new Date().toISOString()
        },
        {
          id: 3,
          name: '订单管理接口测试',
          mode: 'ai',
          status: 'success',
          test_cases_count: 12,
          create_time: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: 4,
          name: '商品管理接口测试',
          mode: 'ai',
          status: 'failed',
          test_cases_count: 3,
          create_time: new Date(Date.now() - 3600000 * 48).toISOString()
        }
      ];
      totalResults.value = analysisList.value.length;
      loading.value = false;
      console.log('使用模拟数据:', analysisList.value);
    }, 500);
    return;
  }
  
  try {
    const response = await request.get('/api/deepseek/analysis/list', {
      params: {
        page: currentPage.value,
        page_size: pageSize.value,
        query: searchQuery.value,
        status: statusFilter.value,
        start_date: dateRange.value && dateRange.value[0] ? dateRange.value[0] : null,
        end_date: dateRange.value && dateRange.value[1] ? dateRange.value[1] : null
      }
    });
    
    if (response.data.code === 200) {
      analysisList.value = response.data.data.results || [];
      totalResults.value = response.data.data.total || 0;
      console.log('获取到分析结果列表:', analysisList.value);
    } else {
      ElMessage.error(response.data.message || '获取分析结果失败');
      console.error('API返回错误:', response.data);
      
      // 如果需要模拟数据便于测试，可以取消注释下面的代码
      /*
      analysisList.value = [
        {
          id: 1,
          name: '登录接口测试用例分析',
          mode: 'ai',
          status: 'success',
          test_cases_count: 5,
          create_time: new Date().toISOString()
        },
        {
          id: 2,
          name: '用户管理接口分析',
          mode: 'template',
          status: 'in_progress',
          test_cases_count: 0,
          create_time: new Date().toISOString()
        }
      ];
      totalResults.value = 2;
      */
    }
  } catch (error) {
    console.error('获取分析结果失败:', error);
    ElMessage.error('获取分析结果失败: ' + (error.message || '未知错误'));
    
    // 添加错误日志，方便排查
    console.log('请求失败详情:', {
      url: '/api/deepseek/analysis/list',
      params: {
        page: currentPage.value,
        page_size: pageSize.value,
        query: searchQuery.value,
        status: statusFilter.value
      },
      error
    });
  } finally {
    loading.value = false;
  }
};

// 刷新结果
const refreshResults = () => {
  getAnalysisResults();
};

// 跳转到生成页面
const navigateToGenerate = () => {
  router.push('/smart-testcases');
};

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1;
  getAnalysisResults();
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  getAnalysisResults();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  getAnalysisResults();
};

// 查看分析详情
const viewAnalysisDetail = async (row) => {
  detailLoading.value = true;
  detailDialogVisible.value = true;
  
  // 使用模拟数据（开发测试用）
  if (useMockData) {
    setTimeout(() => {
      // 创建模拟的测试用例数据
      const mockTestCases = [];
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];
      const priorities = ['高', '中', '低'];
      
      for (let i = 0; i < row.test_cases_count; i++) {
        mockTestCases.push({
          id: i + 1,
          title: `测试用例 ${i + 1} - ${row.name}`,
          api_path: `/api/v1/${['users', 'orders', 'products', 'auth'][i % 4]}/${i + 100}`,
          method: methods[i % methods.length],
          priority: priorities[i % priorities.length],
          description: `这是一个${methods[i % methods.length]}方法的API测试用例。`,
          request_data: JSON.stringify({
            id: i + 100,
            name: `测试数据 ${i + 1}`,
            status: true
          }, null, 2),
          expected_response: JSON.stringify({
            code: 200,
            message: "操作成功",
            data: {
              id: i + 100,
              name: `测试数据 ${i + 1}`,
              status: true
            }
          }, null, 2),
          assertions: JSON.stringify({
            status_code: 200,
            contains: "操作成功"
          }, null, 2)
        });
      }
      
      currentDetail.value = {
        ...row,
        project_id: 1,
        summary: `这是一个关于${row.name}的分析结果，包含了${row.test_cases_count}个测试用例。`,
        test_cases: mockTestCases
      };
      
      detailLoading.value = false;
      console.log('使用模拟详情数据:', currentDetail.value);
    }, 800);
    return;
  }
  
  try {
    const response = await request.get(`/api/deepseek/analysis/${row.id}`);
    if (response.data.code === 200) {
      currentDetail.value = response.data.data;
      console.log('获取到详情数据:', currentDetail.value);
    } else {
      ElMessage.error(response.data.message || '获取详情失败');
      console.error('获取详情API返回错误:', response.data);
    }
  } catch (error) {
    console.error('获取详情失败:', error);
    ElMessage.error('获取详情失败: ' + (error.message || '未知错误'));
  } finally {
    detailLoading.value = false;
  }
};

// 删除分析
const deleteAnalysis = (row) => {
  ElMessageBox.confirm(
    '确定要删除该分析结果吗？此操作不可恢复。',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const response = await request.delete(`/api/analysis/results/${row.id}`);
        if (response.data.code === 200) {
          ElMessage.success('删除成功');
          getAnalysisResults();
        } else {
          ElMessage.error(response.data.message || '删除失败');
        }
      } catch (error) {
        console.error('删除失败:', error);
        ElMessage.error('删除失败: ' + (error.message || '未知错误'));
      }
    })
    .catch(() => {
      // 取消删除
    });
};

// 查看测试用例详情
const viewTestCaseDetail = (testCase) => {
  currentTestCase.value = testCase;
  testCaseDialogVisible.value = true;
};

// 导入单个测试用例
const importSingleTestCase = async (testCase) => {
  importDialogVisible.value = true;
  importing.value = true;
  importProgress.value = 0;
  importStatus.value = '正在导入测试用例...';
  
  try {
    // 模拟进度
    const timer = setInterval(() => {
      if (importProgress.value < 90) {
        importProgress.value += 10;
      }
    }, 200);
    
    const response = await request.post('/api/testcase/import', {
      test_case: testCase,
      project_id: currentDetail.value.project_id || 1 // 确保有项目ID
    });
    
    clearInterval(timer);
    
    if (response.data.code === 200) {
      importProgress.value = 100;
      importStatus.value = '导入成功！';
      ElMessage.success('测试用例导入成功');
    } else {
      importProgress.value = 100;
      importStatus.value = '导入失败: ' + (response.data.message || '未知错误');
      ElMessage.error(response.data.message || '导入失败');
    }
  } catch (error) {
    console.error('导入失败:', error);
    importProgress.value = 100;
    importStatus.value = '导入失败: ' + (error.message || '未知错误');
    ElMessage.error('导入失败: ' + (error.message || '未知错误'));
  } finally {
    importing.value = false;
  }
};

// 导入所有测试用例
const importAllTestCases = async () => {
  if (!currentDetail.value.test_cases || currentDetail.value.test_cases.length === 0) {
    ElMessage.warning('没有可导入的测试用例');
    return;
  }
  
  importDialogVisible.value = true;
  importing.value = true;
  importProgress.value = 0;
  
  const totalCases = currentDetail.value.test_cases.length;
  let importedCount = 0;
  let failedCount = 0;
  
  importStatus.value = `准备导入 ${totalCases} 个测试用例...`;
  
  try {
    for (const testCase of currentDetail.value.test_cases) {
      importStatus.value = `正在导入 (${importedCount + 1}/${totalCases}): ${testCase.title}`;
      
      try {
        const response = await request.post('/api/testcase/create', testCase);
        if (response.data.code === 200) {
          importedCount++;
        } else {
          failedCount++;
          console.error('导入测试用例失败:', response.data.message);
        }
      } catch (error) {
        failedCount++;
        console.error('导入测试用例出错:', error);
      }
      
      // 更新进度
      importProgress.value = Math.floor((importedCount + failedCount) * 100 / totalCases);
    }
    
    importProgress.value = 100;
    
    if (failedCount === 0) {
      importStatus.value = `成功导入全部 ${importedCount} 个测试用例`;
      ElMessage.success(`成功导入全部 ${importedCount} 个测试用例`);
    } else {
      importStatus.value = `导入完成。成功: ${importedCount}, 失败: ${failedCount}`;
      ElMessage.warning(`导入部分完成。成功: ${importedCount}, 失败: ${failedCount}`);
    }
  } catch (error) {
    console.error('批量导入失败:', error);
    importStatus.value = '批量导入过程中出错: ' + (error.message || '未知错误');
    ElMessage.error('批量导入失败: ' + (error.message || '未知错误'));
  } finally {
    importing.value = false;
  }
};

// 导入测试用例到库
const importTestCases = (row) => {
  viewAnalysisDetail(row).then(() => {
    activeTab.value = 'test_cases';
  });
};

// 导出为Excel
const exportToExcel = () => {
  if (!currentDetail.value.test_cases || currentDetail.value.test_cases.length === 0) {
    ElMessage.warning('没有可导出的测试用例');
    return;
  }
  
  ElMessage.success('正在准备导出Excel...');
  
  // 这里可以实现导出Excel的逻辑
  // 或者调用后端API进行导出
  
  // 模拟导出
  setTimeout(() => {
    const fileName = `测试用例_${currentDetail.value.name}_${new Date().getTime()}.xlsx`;
    ElMessage.success(`已导出到: ${fileName}`);
  }, 1000);
};

// 进度格式化
const progressFormat = (percentage) => {
  return percentage === 100 ? '完成' : `${percentage}%`;
};

// 工具函数: 获取状态类型
const getStatusType = (status) => {
  const types = {
    'success': 'success',
    'failed': 'danger',
    'in_progress': 'warning'
  };
  return types[status] || 'info';
};

// 工具函数: 获取状态文本
const getStatusText = (status) => {
  const texts = {
    'success': '成功',
    'failed': '失败',
    'in_progress': '处理中'
  };
  return texts[status] || '未知状态';
};

// 工具函数: 获取请求方法类型
const getMethodType = (method) => {
  const types = {
    'GET': 'success',
    'POST': 'primary',
    'PUT': 'warning',
    'DELETE': 'danger',
    'PATCH': 'info'
  };
  return types[method] || 'info';
};

// 工具函数: 获取优先级类型
const getPriorityType = (priority) => {
  const types = {
    '高': 'danger',
    '中': 'warning',
    '低': 'info'
  };
  return types[priority] || 'info';
};

// 工具函数: 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知';
  
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 工具函数: 格式化JSON
const formatJson = (jsonData) => {
  if (!jsonData) return '{}';
  
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    return JSON.stringify(data, null, 2);
  } catch (error) {
    return jsonData;
  }
};

// 页面加载时获取分析结果
onMounted(() => {
  getAnalysisResults();
});
</script>

<style scoped>
.analysis-results-container {
  padding: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
}

.date-filter {
  display: flex;
  align-items: center;
}

.date-label {
  margin-right: 10px;
  white-space: nowrap;
}

.results-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.json-preview {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow: auto;
  font-family: monospace;
  white-space: pre-wrap;
  max-height: 500px;
}

.code-block {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  margin: 0;
}

.import-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.detail-dialog {
  min-height: 500px;
}

.analysis-summary {
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.raw-data-section {
  max-height: 600px;
  overflow-y: auto;
}

.test-case-detail {
  padding: 10px;
}

.import-progress {
  padding: 20px;
  text-align: center;
}

.import-status {
  margin-top: 20px;
  font-size: 16px;
  color: #606266;
  text-align: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .search-input {
    width: 100%;
  }
  
  .filter-section {
    flex-direction: column;
    gap: 15px;
  }
  
  .date-filter {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .date-filter .el-date-editor {
    width: 100%;
  }
}
</style> 