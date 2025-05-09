<template>
  <Home>
    <PageContainer title="AI接口自动化分析报告">
      <div class="ai-analysis-container">
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索分析结果"
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
            <el-button type="success" @click="analyzeExecutionResults">
              <el-icon><Connection /></el-icon>分析执行结果
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
                    @click="applyFixes(row)"
                    :disabled="row.status !== 'failed'"
                  >
                    应用修复
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
          title="AI分析报告详情"
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
              
              <el-tab-pane label="测试结果分析" name="analysis">
                <div class="analysis-section">
                  <h3>AI分析结果</h3>
                  <div class="analysis-content">
                    <el-card v-for="(analysis, index) in currentDetail.analysis || []" :key="index" class="analysis-card">
                      <template #header>
                        <div class="card-header">
                          <span>{{ analysis.title }}</span>
                          <el-tag :type="analysis.success ? 'success' : 'danger'">
                            {{ analysis.success ? '通过' : '失败' }}
                          </el-tag>
                        </div>
                      </template>
                      <div class="analysis-detail">
                        <div class="api-info">
                          <div class="info-item">
                            <span class="label">API路径:</span>
                            <span class="value">{{ analysis.api_path }}</span>
                          </div>
                          <div class="info-item">
                            <span class="label">请求方法:</span>
                            <el-tag :type="getMethodType(analysis.method)" size="small">{{ analysis.method }}</el-tag>
                          </div>
                        </div>
                        <div class="analysis-reason">
                          <h4>分析结果</h4>
                          <div class="reason-content">{{ analysis.reason }}</div>
                        </div>
                        
                        <div v-if="!analysis.success" class="fix-suggestion">
                          <h4>修复建议</h4>
                          <div class="suggestion-content">
                            <div class="code-diff">
                              <div class="file-path">{{ analysis.file_path }}</div>
                              <pre class="code-block">{{ analysis.code_diff }}</pre>
                            </div>
                            <el-button 
                              type="primary" 
                              size="small" 
                              @click="applyFixSingle(analysis)"
                              class="fix-button"
                            >
                              应用此修复
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </el-card>
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
                @click="generateReport"
                :disabled="!currentDetail.test_cases || currentDetail.test_cases.length === 0"
              >
                生成完整报告
              </el-button>
            </span>
          </template>
        </el-dialog>
        
        <!-- 选择执行结果弹窗 -->
        <el-dialog
          v-model="selectExecutionDialogVisible"
          title="选择要分析的执行结果"
          width="60%"
          destroy-on-close
        >
          <div class="execution-selector">
            <el-table 
              :data="executionResults"
              style="width: 100%"
              v-loading="loadingExecutions"
              @row-click="handleRowClick"
              highlight-current-row
            >
              <el-table-column prop="execution_id" label="执行ID" width="80" />
              <el-table-column prop="suite_name" label="测试套件" min-width="150" show-overflow-tooltip />
              <el-table-column prop="start_time" label="执行时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.start_time) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="success_rate" label="成功率" width="120">
                <template #default="{ row }">
                  {{ row.success_rate }}%
                </template>
              </el-table-column>
              <el-table-column prop="total_cases" label="用例总数" width="100" align="center" />
            </el-table>
          </div>
          
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="selectExecutionDialogVisible = false">取消</el-button>
              <el-button 
                type="primary" 
                @click="confirmAnalysis"
                :disabled="!selectedExecution"
              >
                开始分析
              </el-button>
            </span>
          </template>
        </el-dialog>
        
        <!-- 修复确认弹窗 -->
        <el-dialog
          v-model="fixConfirmDialogVisible"
          title="代码修复确认"
          width="50%"
          destroy-on-close
        >
          <div class="fix-confirm-content">
            <p>确认要应用以下修复吗？</p>
            <div class="file-path">{{ currentFix.file_path }}</div>
            <pre class="code-block">{{ currentFix.code_diff }}</pre>
          </div>
          
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="fixConfirmDialogVisible = false">取消</el-button>
              <el-button 
                type="success" 
                @click="confirmFix"
                :loading="applying"
              >
                确认修复
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
  Connection, 
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
const loadingExecutions = ref(false);
const applying = ref(false);

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
const selectExecutionDialogVisible = ref(false);
const fixConfirmDialogVisible = ref(false);

// 当前查看的详情
const currentDetail = ref({});
const activeTab = ref('info');

// 执行结果数据
const executionResults = ref([]);
const selectedExecution = ref(null);

// 当前修复
const currentFix = ref({
  file_path: '',
  code_diff: ''
});

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
          name: '登录接口自动化测试分析',
          mode: 'ai',
          status: 'success',
          test_cases_count: 5,
          create_time: new Date().toISOString()
        },
        {
          id: 2,
          name: '用户管理接口分析',
          mode: 'ai',
          status: 'in_progress',
          test_cases_count: 3,
          create_time: new Date().toISOString()
        },
        {
          id: 3,
          name: '订单管理接口测试',
          mode: 'ai',
          status: 'failed',
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
    const response = await request.get('/api/ai-analysis/list', {
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
    }
  } catch (error) {
    console.error('获取分析结果失败:', error);
    ElMessage.error('获取分析结果失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

// 刷新结果
const refreshResults = () => {
  getAnalysisResults();
};

// 跳转到生成页面
const analyzeExecutionResults = () => {
  selectExecutionDialogVisible.value = true;
  getExecutionResults();
};

// 获取执行结果列表
const getExecutionResults = async () => {
  loadingExecutions.value = true;
  
  // 使用模拟数据（开发测试用）
  if (useMockData) {
    setTimeout(() => {
      executionResults.value = [
        {
          execution_id: 1001,
          suite_name: '登录接口测试套件',
          start_time: new Date().toISOString(),
          status: 'success',
          success_rate: 100,
          total_cases: 5
        },
        {
          execution_id: 1002,
          suite_name: '用户管理接口测试套件',
          start_time: new Date(Date.now() - 3600000 * 2).toISOString(),
          status: 'failed',
          success_rate: 67,
          total_cases: 3
        },
        {
          execution_id: 1003,
          suite_name: '订单管理接口测试套件',
          start_time: new Date(Date.now() - 3600000 * 24).toISOString(),
          status: 'failed',
          success_rate: 75,
          total_cases: 12
        }
      ];
      loadingExecutions.value = false;
      console.log('使用模拟执行结果数据:', executionResults.value);
    }, 500);
    return;
  }
  
  try {
    const response = await request.get('/api/execution/list');
    if (response.data.code === 200) {
      executionResults.value = response.data.data || [];
      console.log('获取到执行结果列表:', executionResults.value);
    } else {
      ElMessage.error(response.data.message || '获取执行结果失败');
    }
  } catch (error) {
    console.error('获取执行结果失败:', error);
    ElMessage.error('获取执行结果失败: ' + (error.message || '未知错误'));
  } finally {
    loadingExecutions.value = false;
  }
};

// 行点击处理
const handleRowClick = (row) => {
  selectedExecution.value = row;
  console.log('选中执行结果:', row);
};

// 确认分析
const confirmAnalysis = () => {
  if (!selectedExecution.value) {
    ElMessage.warning('请先选择要分析的执行结果');
    return;
  }
  
  startAnalysis(selectedExecution.value);
  selectExecutionDialogVisible.value = false;
};

// 开始分析
const startAnalysis = async (execution) => {
  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: '正在进行AI分析...',
    background: 'rgba(0, 0, 0, 0.7)'
  });
  
  try {
    // 使用模拟数据（开发测试用）
    if (useMockData) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      ElMessage.success('AI分析完成');
      refreshResults();
      loadingInstance.close();
      return;
    }
    
    const response = await request.post('/api/ai-analysis/create', {
      execution_id: execution.execution_id,
      suite_name: execution.suite_name
    });
    
    if (response.data.code === 200) {
      ElMessage.success('AI分析任务已创建，请稍后查看结果');
      refreshResults();
    } else {
      ElMessage.error(response.data.message || '创建分析任务失败');
    }
  } catch (error) {
    console.error('分析失败:', error);
    ElMessage.error('分析失败: ' + (error.message || '未知错误'));
  } finally {
    loadingInstance.close();
  }
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
      // 创建模拟的分析数据
      const mockAnalysis = [];
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];
      
      if (row.status === 'failed') {
        mockAnalysis.push(
          {
            title: '用户登录接口失败分析',
            success: false,
            api_path: '/api/v1/auth/login',
            method: 'POST',
            reason: '接口返回状态码 500，服务器内部错误。分析发现可能是由于用户验证逻辑中的空指针异常导致的。',
            file_path: 'src/controllers/AuthController.java',
            code_diff: `@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
-   User user = userRepository.findByUsername(request.getUsername());
-   if (user.getPassword().equals(passwordEncoder.encode(request.getPassword()))) {
+   User user = userRepository.findByUsername(request.getUsername());
+   if (user != null && user.getPassword().equals(passwordEncoder.encode(request.getPassword()))) {
        // 生成token逻辑
        return ResponseEntity.ok(new LoginResponse(token));
    }
    return ResponseEntity.status(401).body("认证失败");
}`
          },
          {
            title: '获取用户信息接口失败分析',
            success: false,
            api_path: '/api/v1/users/{userId}',
            method: 'GET',
            reason: '接口返回状态码 404，找不到资源。分析发现 URL 路径参数解析错误，应使用路径变量注解。',
            file_path: 'src/controllers/UserController.java',
            code_diff: `@GetMapping("/{userId}")
-public ResponseEntity<?> getUserById(Long userId) {
+public ResponseEntity<?> getUserById(@PathVariable Long userId) {
    Optional<User> user = userRepository.findById(userId);
    return user.map(ResponseEntity::ok)
               .orElse(ResponseEntity.notFound().build());
}`
          }
        );
      } else {
        // 成功案例
        mockAnalysis.push(
          {
            title: '用户登录接口',
            success: true,
            api_path: '/api/v1/auth/login',
            method: 'POST',
            reason: '接口返回状态码 200，测试通过。响应数据符合预期，包含有效的认证令牌。'
          },
          {
            title: '用户注册接口',
            success: true,
            api_path: '/api/v1/auth/register',
            method: 'POST',
            reason: '接口返回状态码 201，用户创建成功。数据库检查显示用户记录已正确创建。'
          }
        );
      }
      
      currentDetail.value = {
        ...row,
        project_id: 1,
        summary: `这是一个关于${row.name}的AI分析结果，${row.status === 'failed' ? '发现了一些问题需要修复' : '所有测试都通过了'}。`,
        analysis: mockAnalysis,
        test_cases: mockAnalysis.map((a, index) => ({
          id: index + 1,
          title: a.title,
          api_path: a.api_path,
          method: a.method,
          success: a.success
        }))
      };
      
      detailLoading.value = false;
      console.log('使用模拟详情数据:', currentDetail.value);
    }, 800);
    return;
  }
  
  try {
    const response = await request.get(`/api/ai-analysis/${row.id}`);
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
        if (useMockData) {
          ElMessage.success('删除成功');
          analysisList.value = analysisList.value.filter(item => item.id !== row.id);
          totalResults.value = analysisList.value.length;
          return;
        }
        
        const response = await request.delete(`/api/ai-analysis/${row.id}`);
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

// 应用修复
const applyFixes = (row) => {
  viewAnalysisDetail(row).then(() => {
    activeTab.value = 'analysis';
  });
};

// 应用单个修复
const applyFixSingle = (fix) => {
  currentFix.value = {
    file_path: fix.file_path,
    code_diff: fix.code_diff
  };
  fixConfirmDialogVisible.value = true;
};

// 确认修复
const confirmFix = async () => {
  applying.value = true;
  
  try {
    // 使用模拟数据（开发测试用）
    if (useMockData) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      ElMessage.success('代码修复已成功应用');
      fixConfirmDialogVisible.value = false;
      applying.value = false;
      return;
    }
    
    const response = await request.post('/api/ai-analysis/apply-fix', {
      file_path: currentFix.value.file_path,
      code_diff: currentFix.value.code_diff
    });
    
    if (response.data.code === 200) {
      ElMessage.success('代码修复已成功应用');
      fixConfirmDialogVisible.value = false;
    } else {
      ElMessage.error(response.data.message || '应用修复失败');
    }
  } catch (error) {
    console.error('应用修复失败:', error);
    ElMessage.error('应用修复失败: ' + (error.message || '未知错误'));
  } finally {
    applying.value = false;
  }
};

// 生成完整报告
const generateReport = () => {
  ElMessage.success('正在生成完整报告...');
  // 这里可以实现生成报告的逻辑
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

// 页面加载时获取分析结果
onMounted(() => {
  getAnalysisResults();
});
</script>

<style scoped>
.ai-analysis-container {
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
  line-height: 1.5;
  overflow-x: auto;
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

.analysis-section {
  padding: 10px;
}

.analysis-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.analysis-detail {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.api-info {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.label {
  font-weight: bold;
  color: #606266;
}

.analysis-reason {
  background-color: #f8f8f8;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #409EFF;
}

.fix-suggestion {
  background-color: #f0f9eb;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #67C23A;
}

.suggestion-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.file-path {
  font-family: monospace;
  color: #606266;
  margin-bottom: 5px;
  font-weight: bold;
}

.fix-button {
  align-self: flex-start;
}

.execution-selector {
  max-height: 400px;
  overflow-y: auto;
}

.fix-confirm-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
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