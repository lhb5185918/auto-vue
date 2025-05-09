<template>
  <Home>
    <PageContainer title="智能测试用例维护">
      <div class="smart-testcases-container">
        <div class="header-actions">
          <el-button type="primary" @click="showGenerateDialog">
            <el-icon><Plus /></el-icon>测试用例生成
          </el-button>
          <el-button type="success" @click="showEnhanceDialog">
            <el-icon><Star /></el-icon>智能增强测试用例生成
          </el-button>
          <el-button type="info" @click="showConfigDialog">
            <el-icon><Setting /></el-icon>配置
          </el-button>
        </div>
        
        <div class="content-area">
          <div class="section-header">
            <h2>智能测试用例维护</h2>
            <p>上传项目文件，使用AI智能分析并生成测试用例</p>
          </div>
          
          <!-- 分析结果列表 -->
          <div class="analysis-list-container">
            <el-card shadow="hover" class="analysis-list-card">
              <template #header>
                <div class="card-header">
                  <span>分析结果列表</span>
                  <el-button type="primary" size="small" @click="refreshAnalysisList">
                    <el-icon><Refresh /></el-icon>刷新
                  </el-button>
                </div>
              </template>
              
              <el-table 
                :data="analysisList" 
                style="width: 100%"
                border
                v-loading="listLoading"
                :empty-text="emptyText"
              >
                <el-table-column prop="file_name" label="文件名称" min-width="180" show-overflow-tooltip />
                <el-table-column prop="file_type" label="文件类型" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag size="small">{{ row.file_type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="model" label="使用模型" width="150" align="center">
                  <template #default="{ row }">
                    <el-tag type="success" size="small">{{ row.model || 'deepseek-chat' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="create_time" label="分析时间" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.create_time) }}
                  </template>
                </el-table-column>
                <el-table-column prop="test_cases_count" label="测试用例数" width="100" align="center" />
                <el-table-column label="操作" width="220" align="center" fixed="right">
                  <template #default="{ row }">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="viewAnalysisResult(row)"
                      style="margin-right: 5px"
                    >
                      查看
                    </el-button>
                    <el-button 
                      type="success" 
                      size="small" 
                      @click="generateTestCases(row)"
                      style="margin-right: 5px"
                    >
                      生成用例
                    </el-button>
                    <el-button 
                      type="danger" 
                      size="small" 
                      @click="deleteAnalysis(row)"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="currentPage"
                  v-model:page-size="pageSize"
                  :page-sizes="[10, 20, 50]"
                  layout="total, sizes, prev, pager, next"
                  :total="total"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </el-card>
          </div>
          
          <!-- 文件上传弹窗 -->
          <el-dialog
            title="上传文件生成测试用例"
            v-model="dialogVisible"
            width="500px"
          >
            <el-upload
              class="upload-container"
              drag
              multiple
              :auto-upload="false"
              :on-change="handleFileChange"
              :file-list="uploadFileList"
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  请上传项目文件，系统将自动生成智能测试用例
                </div>
              </template>
            </el-upload>
            
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleUpload" :loading="uploading">
                  上传
                </el-button>
              </span>
            </template>
          </el-dialog>
          
          <!-- 智能增强测试用例生成弹窗 -->
          <el-dialog
            title="智能增强测试用例生成"
            v-model="enhanceDialogVisible"
            width="500px"
          >
            <el-upload
              class="upload-container"
              drag
              multiple
              :auto-upload="false"
              :on-change="handleEnhanceFileChange"
              :file-list="enhanceFileList"
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  上传项目文件，系统将自动生成智能增强测试用例
                </div>
              </template>
            </el-upload>
            
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="enhanceDialogVisible = false">取消</el-button>
                <el-button type="success" @click="handleEnhanceUpload" :loading="enhanceUploading">
                  开始增强
                </el-button>
              </span>
            </template>
          </el-dialog>
          
          <!-- DeepSeek配置弹窗 -->
          <el-dialog
            title="DeepSeek配置"
            v-model="configDialogVisible"
            width="500px"
          >
            <el-form 
              :model="configForm" 
              label-width="100px"
              :rules="configRules"
              ref="configFormRef"
            >
              <el-form-item label="API Key" prop="apiKey">
                <el-input 
                  v-model="configForm.apiKey" 
                  placeholder="请输入DeepSeek API Key"
                  show-password
                />
              </el-form-item>
              
              <el-form-item label="模型" prop="model">
                <el-select 
                  v-model="configForm.model" 
                  placeholder="请选择DeepSeek模型"
                  style="width: 100%"
                >
                  <el-option label="DeepSeek-Chat" value="deepseek-chat" />
                  <el-option label="DeepSeek-Reasoner" value="deepseek-reasoner" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="温度系数" prop="temperature">
                <el-slider 
                  v-model="configForm.temperature" 
                  :min="0" 
                  :max="1" 
                  :step="0.01"
                  :format-tooltip="temperatureTooltip"
                />
              </el-form-item>
            </el-form>
            
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="configDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveConfig" :loading="savingConfig">
                  保存配置
                </el-button>
              </span>
            </template>
          </el-dialog>
          
          <!-- 分析结果展示弹窗 -->
          <el-dialog
            title="文件分析结果"
            v-model="analysisDialogVisible"
            width="80%"
            :fullscreen="isMobile"
            class="analysis-dialog"
            :close-on-click-modal="false"
            :destroy-on-close="true"
            top="5vh"
          >
            <div v-if="analysisResult" class="analysis-content">
              <el-tabs type="border-card" v-model="activeTab">
                <el-tab-pane label="分析概要" name="info">
                  <div class="analysis-overview">
                    <el-descriptions :column="2" border>
                      <el-descriptions-item label="文件名称">{{ analysisResult.file_name }}</el-descriptions-item>
                      <el-descriptions-item label="文件类型">{{ analysisResult.file_type }}</el-descriptions-item>
                      <el-descriptions-item label="使用模型">{{ analysisResult.deepseek_response?.model || '未知' }}</el-descriptions-item>
                      <el-descriptions-item label="状态">
                        <el-tag type="success" v-if="analysisResult.deepseek_response?.status === 'success'">解析成功</el-tag>
                        <el-tag type="danger" v-else>解析失败</el-tag>
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>
                  
                  <div class="analysis-summary" v-if="analysisResult.deepseek_response?.content">
                    <h3>分析内容</h3>
                    <div class="analysis-formatted-content">
                      <p v-for="(line, index) in formattedAnalysisContent" :key="index">{{ line }}</p>
                    </div>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="详细数据" name="detail">
                  <div class="sheet-data" v-if="analysisResult.sheets && analysisResult.sheets.length">
                    <el-collapse accordion>
                      <el-collapse-item v-for="(sheet, sheetIndex) in analysisResult.sheets" :key="sheetIndex" :title="sheet[0]?.name || `工作表 ${sheetIndex+1}`">
                        <div class="sheet-table-container">
                          <el-table :data="sheet[0]?.data || []" border style="width: 100%">
                            <el-table-column type="index" width="50" label="#" />
                            <el-table-column 
                              v-for="(column, colIndex) in getTableColumns(sheet)" 
                              :key="colIndex" 
                              :prop="column.prop" 
                              :label="column.label" 
                              :width="column.width || ''"
                              show-overflow-tooltip
                            />
                          </el-table>
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                  
                  <div class="raw-data">
                    <el-collapse>
                      <el-collapse-item title="DeepSeek原始响应数据">
                        <pre class="json-preview">{{ JSON.stringify(analysisResult.deepseek_response, null, 2) }}</pre>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="测试用例生成" name="test_cases">
                  <div class="testcase-generation">
                    <el-alert
                      title="根据文件分析结果，系统已生成测试用例建议"
                      type="success"
                      :closable="false"
                      show-icon
                      description="您可以查看建议的测试用例并选择创建到系统中"
                    />
                    
                    <div v-if="analysisResult.deepseek_response?.test_cases && analysisResult.deepseek_response.test_cases.length > 0" class="test-cases-list">
                      <el-table 
                        :data="analysisResult.deepseek_response.test_cases" 
                        border 
                        style="width: 100%"
                        :max-height="500"
                        v-loading="tableLoading"
                      >
                        <el-table-column type="index" width="50" label="#" align="center" />
                        <el-table-column prop="title" label="用例名称" min-width="200" show-overflow-tooltip />
                        <el-table-column prop="api_path" label="API路径" min-width="180" show-overflow-tooltip />
                        <el-table-column prop="method" label="请求方法" width="100" align="center">
                          <template #default="{ row }">
                            <el-tag 
                              :type="getMethodTagType(row.method)" 
                              size="small"
                            >
                              {{ row.method || 'GET' }}
                            </el-tag>
                          </template>
                        </el-table-column>
                        <el-table-column prop="priority" label="优先级" width="80" align="center">
                          <template #default="{ row }">
                            <el-tag 
                              :type="getPriorityTagType(row.priority)" 
                              size="small"
                            >
                              {{ row.priority }}
                            </el-tag>
                          </template>
                        </el-table-column>
                        <el-table-column label="操作" width="180" align="center" fixed="right">
                          <template #default="{ row }">
                            <el-button 
                              type="warning" 
                              size="small" 
                              @click="editTestCase(row)"
                              style="margin-right: 5px"
                            >
                              编辑
                            </el-button>
                            <el-button 
                              type="primary" 
                              size="small" 
                              @click="createTestCase(row)"
                              :loading="row.creating"
                            >
                              生成用例
                            </el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                    
                    <div v-else class="no-test-cases">
                      <el-empty description="未生成测试用例建议" />
                    </div>

                    <div class="action-buttons">
                      <el-button type="success" @click="batchCreateTestCases" :loading="batchCreating" :disabled="!hasTestCases">
                        批量生成全部测试用例
                      </el-button>
                      <el-button type="primary" @click="exportTestCases" :disabled="!hasTestCases">
                        导出测试用例
                      </el-button>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
            <div v-else class="no-data">
              <el-empty description="暂无分析数据" />
            </div>
            
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="analysisDialogVisible = false">关闭</el-button>
                <el-button type="primary" @click="saveAnalysisResult">
                  保存分析结果
                </el-button>
              </span>
            </template>
          </el-dialog>

          <!-- 测试用例编辑对话框 -->
          <el-dialog
            title="编辑测试用例"
            v-model="editDialogVisible"
            width="60%"
            :close-on-click-modal="false"
            :destroy-on-close="true"
          >
            <el-form 
              v-if="currentTestCase"
              :model="currentTestCase" 
              label-width="100px"
              ref="editFormRef"
              class="edit-test-case-form"
            >
              <el-form-item label="用例名称" prop="title">
                <el-input v-model="currentTestCase.title" placeholder="请输入测试用例名称" />
              </el-form-item>
              
              <el-form-item label="API路径" prop="api_path">
                <el-input v-model="currentTestCase.api_path" placeholder="请输入API路径" />
              </el-form-item>
              
              <el-form-item label="项目ID" prop="project_id">
                <el-input-number v-model="currentTestCase.project_id" :min="1" placeholder="请输入项目ID" style="width: 100%" />
              </el-form-item>
              
              <el-form-item label="请求方法" prop="method">
                <el-select v-model="currentTestCase.method" placeholder="请选择请求方法" style="width: 100%">
                  <el-option label="GET" value="GET" />
                  <el-option label="POST" value="POST" />
                  <el-option label="PUT" value="PUT" />
                  <el-option label="DELETE" value="DELETE" />
                  <el-option label="PATCH" value="PATCH" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="优先级" prop="priority">
                <el-select v-model="currentTestCase.priority" placeholder="请选择优先级" style="width: 100%">
                  <el-option label="高" value="高" />
                  <el-option label="中" value="中" />
                  <el-option label="低" value="低" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="请求数据" prop="request_data">
                <el-input 
                  v-model="requestDataJson" 
                  type="textarea" 
                  :rows="6" 
                  placeholder="请输入JSON格式的请求数据"
                  class="monospace-input"
                />
              </el-form-item>
              
              <el-form-item label="预期响应" prop="expected_response">
                <el-input 
                  v-model="expectedResponseJson" 
                  type="textarea" 
                  :rows="6" 
                  placeholder="请输入JSON格式的预期响应"
                  class="monospace-input"
                />
              </el-form-item>
              
              <el-form-item label="描述" prop="description">
                <el-input 
                  v-model="currentTestCase.description" 
                  type="textarea" 
                  :rows="3" 
                  placeholder="请输入测试用例描述"
                />
              </el-form-item>
              
              <el-form-item label="断言" prop="assertions">
                <el-select v-model="currentTestCase.assertions" placeholder="请选择断言类型" style="width: 100%">
                  <el-option label="JSON" value="json" />
                  <el-option label="状态码" value="status" />
                  <el-option label="包含文本" value="text" />
                </el-select>
              </el-form-item>
            </el-form>
            
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="editDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveTestCaseEdit" :loading="savingEdit">
                  保存修改
                </el-button>
              </span>
            </template>
          </el-dialog>
        </div>
      </div>
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import request from '@/utils/request';

// 弹窗控制
const dialogVisible = ref(false);
const uploadFileList = ref([]);
const uploading = ref(false);

// 智能增强弹窗控制
const enhanceDialogVisible = ref(false);
const enhanceFileList = ref([]);
const enhanceUploading = ref(false);

// 配置弹窗控制
const configDialogVisible = ref(false);
const configFormRef = ref(null);
const savingConfig = ref(false);
const configForm = ref({
  apiKey: '',
  model: 'deepseek-chat',
  temperature: 0.5
});

// 配置表单验证规则
const configRules = {
  apiKey: [
    { required: true, message: '请输入DeepSeek API Key', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '请选择DeepSeek模型', trigger: 'change' }
  ]
};

// 分析结果弹窗控制
const analysisDialogVisible = ref(false);
const analysisResult = ref(null);
const isMobile = ref(window.innerWidth <= 768);
const tableLoading = ref(false);
const batchCreating = ref(false);
const detailLoading = ref(false);
const activeTab = ref('info'); // 分析结果标签页默认选中info标签

// 测试用例编辑相关
const editDialogVisible = ref(false);
const currentTestCase = ref(null);
const requestDataJson = ref('');
const expectedResponseJson = ref('');
const savingEdit = ref(false);
const editFormRef = ref(null);

// 分析结果相关变量
const analysisList = ref([]);
const listLoading = ref(false);
const emptyText = ref('暂无分析结果数据');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 格式化日期
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

// 获取分析结果列表
const getAnalysisList = async () => {
  listLoading.value = true;
  emptyText.value = '正在加载...';
  
  try {
    console.log('正在调用分析结果列表接口: /api/analysis/results');
    const response = await request.get('/api/analysis/results', {
      params: {
        page: currentPage.value,
        page_size: pageSize.value
      }
    });
    
    console.log('分析结果列表接口响应:', response);
    
    if (response.data.code === 200) {
      // 适配后端API实际响应结构
      if (Array.isArray(response.data.data)) {
        // 如果直接返回数组
        analysisList.value = response.data.data;
      } else if (response.data.data && response.data.data.results) {
        // 如果返回分页对象
        analysisList.value = response.data.data.results;
        total.value = response.data.data.total || analysisList.value.length;
      } else {
        // 如果直接返回对象
        analysisList.value = [response.data.data].filter(Boolean);
      }
      
      // 确保每一项都有id字段
      analysisList.value.forEach((item, index) => {
        if (!item.id) {
          console.warn(`数据项缺少id字段，设置为${index + 1}:`, item);
          item.id = index + 1;
        }
      });
      
      total.value = total.value || analysisList.value.length;
      emptyText.value = analysisList.value.length === 0 ? '暂无分析结果数据' : '';
      console.log('获取到分析结果列表:', analysisList.value, '总数:', total.value);
    } else {
      emptyText.value = '加载失败: ' + (response.data.message || '未知错误');
      ElMessage.error(response.data.message || '获取分析结果失败');
      console.error('API返回错误:', response.data);
      
      // 使用模拟数据便于测试
      analysisList.value = [
        {
          id: 1,
          file_name: '登录接口测试用例分析.json',
          file_type: 'json',
          model: 'deepseek-chat',
          status: 'success',
          test_cases_count: 5,
          create_time: new Date().toISOString()
        },
        {
          id: 2,
          file_name: '用户管理接口分析.java',
          file_type: 'java',
          model: 'deepseek-chat',
          status: 'in_progress',
          test_cases_count: 0,
          create_time: new Date().toISOString()
        }
      ];
      
      // 确保每一项都有ID
      analysisList.value.forEach((item, index) => {
        if (!item.id) {
          item.id = index + 1;
        }
      });
      
      total.value = analysisList.value.length;
      console.log('异常情况使用模拟数据:', analysisList.value, '总数:', total.value);
    }
  } catch (error) {
    console.error('获取分析结果失败:', error);
    emptyText.value = '网络错误，请稍后重试';
    ElMessage.error('获取分析结果失败: ' + (error.message || '未知错误'));
    
    // 使用模拟数据便于测试
    analysisList.value = [
      {
        id: 1,
        file_name: '登录接口测试用例分析.json',
        file_type: 'json',
        model: 'deepseek-chat',
        status: 'success',
        test_cases_count: 5,
        create_time: new Date().toISOString()
      },
      {
        id: 2,
        file_name: '用户管理接口分析.java',
        file_type: 'java',
        model: 'deepseek-chat',
        status: 'in_progress',
        test_cases_count: 0,
        create_time: new Date().toISOString()
      }
    ];
    
    // 确保每一项都有ID
    analysisList.value.forEach((item, index) => {
      if (!item.id) {
        item.id = index + 1;
      }
    });
    
    total.value = analysisList.value.length;
    console.log('异常情况使用模拟数据:', analysisList.value, '总数:', total.value);
  } finally {
    listLoading.value = false;
  }
};

// 刷新结果列表
const refreshAnalysisList = () => {
  getAnalysisList();
};

// 查看分析结果
const viewAnalysisResult = async (row) => {
  detailLoading.value = true;
  analysisDialogVisible.value = true;
  
  try {
    // 检查ID是否存在
    if (!row.id) {
      console.error('查看分析结果错误: ID未定义', row);
      ElMessage.error('无法获取分析结果，ID未定义');
      
      // 使用模拟数据
      analysisResult.value = {
        file_name: row.file_name || '未知文件',
        file_type: row.file_type || 'unknown',
        deepseek_response: {
          model: row.model || 'deepseek-chat',
          status: 'success',
          content: '模拟数据 - 无法获取真实分析结果，因为ID未定义。',
          test_cases: generateMockTestCases(row.test_cases_count || 3, row.file_name || '未知文件')
        }
      };
      
      detailLoading.value = false;
      return;
    }
    
    console.log(`正在调用分析结果详情接口: /api/analysis/results/${row.id}`, '行数据:', row);
    const response = await request.get(`/api/analysis/results/${row.id}`);
    console.log('分析结果详情接口响应:', response);
    
    if (response.data.code === 200) {
      analysisResult.value = response.data.data;
      console.log('获取到详情数据:', analysisResult.value);
    } else {
      ElMessage.error(response.data.message || '获取详情失败');
      console.error('获取详情API返回错误:', response.data);
      
      // 模拟数据
      analysisResult.value = {
        file_name: row.file_name || '未知文件',
        file_type: row.file_type || 'unknown',
        deepseek_response: {
          model: row.model || 'deepseek-chat',
          status: 'success',
          content: '模拟数据 - 无法获取真实分析结果，因为API返回错误。',
          test_cases: generateMockTestCases(row.test_cases_count || 3, row.file_name || '未知文件')
        }
      };
    }
  } catch (error) {
    console.error('获取详情失败:', error);
    ElMessage.error('获取详情失败: ' + (error.message || '未知错误'));
    
    // 模拟数据
    analysisResult.value = {
      file_name: row.file_name || '未知文件',
      file_type: row.file_type || 'unknown',
      deepseek_response: {
        model: row.model || 'deepseek-chat',
        status: 'success',
        content: '模拟数据 - 获取分析结果失败，使用模拟数据。',
        test_cases: generateMockTestCases(row.test_cases_count || 3, row.file_name || '未知文件')
      }
    };
  } finally {
    detailLoading.value = false;
  }
};

// 生成模拟测试用例
const generateMockTestCases = (count, fileName) => {
  const testCases = [];
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const priorities = ['高', '中', '低'];
  
  for (let i = 0; i < count; i++) {
    testCases.push({
      id: i + 1,
      title: `测试用例 ${i + 1} - ${fileName}`,
      api_path: `/api/v1/${['users', 'orders', 'products', 'auth'][i % 4]}/${i + 100}`,
      method: methods[i % methods.length],
      priority: priorities[i % priorities.length],
      description: `这是一个${methods[i % methods.length]}方法的API测试用例。`,
      request_data: {
        id: i + 100,
        name: `测试数据 ${i + 1}`,
        status: true
      },
      expected_response: {
        code: 200,
        message: "操作成功",
        data: {
          id: i + 100,
          name: `测试数据 ${i + 1}`,
          status: true
        }
      },
      assertions: {
        status_code: 200,
        contains: "操作成功"
      }
    });
  }
  
  return testCases;
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  getAnalysisList();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  getAnalysisList();
};

// 删除分析
const deleteAnalysis = (row) => {
  ElMessage.confirm(
    `确定要删除"${row.file_name}"分析结果吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        console.log(`正在调用删除接口: /api/analysis/results/${row.id}`);
        const response = await request.delete(`/api/analysis/results/${row.id}`);
        console.log('删除接口响应:', response);
        
        // 不同的响应格式处理
        const isSuccess = 
          response.data.code === 200 || 
          response.status === 200 || 
          response.data.success === true;
        
        if (isSuccess) {
          ElMessage.success('删除成功');
          getAnalysisList(); // 刷新列表
        } else {
          ElMessage.error(response.data.message || '删除失败');
        }
      } catch (error) {
        console.error('删除失败:', error);
        ElMessage.error('删除失败: ' + (error.message || '未知错误'));
      }
    })
    .catch(() => {
      // 取消删除操作
    });
};

// 生成测试用例
const generateTestCases = (row) => {
  // 先查看分析结果
  viewAnalysisResult(row).then(() => {
    // 切换到测试用例生成标签页
    activeTab.value = 'test_cases';
  });
};

// 计算是否有测试用例
const hasTestCases = computed(() => {
  return analysisResult.value?.deepseek_response?.test_cases && 
         analysisResult.value.deepseek_response.test_cases.length > 0;
});

// 格式化显示分析内容
const formattedAnalysisContent = computed(() => {
  if (!analysisResult.value?.deepseek_response?.content) return [];
  
  // 将内容按换行符分割成数组
  const content = analysisResult.value.deepseek_response.content;
  return content.split('\n').filter(line => line.trim() !== '');
});

// 从表格数据中获取列定义
const getTableColumns = (sheet) => {
  if (!sheet || !sheet[0] || !sheet[0].data || !sheet[0].data[0]) {
    return [];
  }
  
  // 获取数据的第一行（通常是表头）或者分析对象的键名
  const firstRow = sheet[0].data[0];
  
  if (typeof firstRow === 'object') {
    // 如果是对象，使用其键名作为列名
    return Object.keys(firstRow).map(key => ({
      prop: key,
      label: key,
      width: key.length > 10 ? '180' : ''
    }));
  } else {
    // 如果不是对象，则可能是数组，提取数据
    return sheet[0].data.map((_, index) => ({
      prop: `column${index}`,
      label: `列 ${index + 1}`,
      width: ''
    }));
  }
};

// 温度系数格式化
const temperatureTooltip = (val) => {
  return val.toFixed(2);
};

// 窗口大小变化处理
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth <= 768;
});

// 显示生成对话框
const showGenerateDialog = () => {
  dialogVisible.value = true;
};

// 显示增强对话框
const showEnhanceDialog = () => {
  enhanceDialogVisible.value = true;
};

// 显示配置对话框
const showConfigDialog = () => {
  // 加载已保存的配置
  loadConfig();
  configDialogVisible.value = true;
};

// 加载已保存的配置
const loadConfig = () => {
  try {
    const savedConfig = localStorage.getItem('deepseekConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      configForm.value = {
        ...configForm.value,
        ...config
      };
    }
  } catch (error) {
    console.error('加载配置失败:', error);
  }
};

// 保存配置
const saveConfig = async () => {
  if (!configFormRef.value) return;
  
  try {
    await configFormRef.value.validate();
    
    savingConfig.value = true;
    
    try {
      // 保存到本地存储
      localStorage.setItem('deepseekConfig', JSON.stringify(configForm.value));
      
      // 调用API保存配置到服务器
      const response = await request.post('/api/config/deepseek', configForm.value);
      
      if (response.data.code === 200) {
        ElMessage.success('配置保存成功');
        configDialogVisible.value = false;
      } else {
        ElMessage.error(`保存失败: ${response.data.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      ElMessage.error('保存配置失败，请检查网络连接或联系管理员');
    }
  } catch (error) {
    console.error('表单验证失败:', error);
  } finally {
    savingConfig.value = false;
  }
};

// 保存分析结果
const saveAnalysisResult = async () => {
  if (!analysisResult.value) return;
  
  try {
    // 调用API保存分析结果到服务器
    const response = await request.post('/api/analysis/save', {
      analysis_data: analysisResult.value,
      file_name: analysisResult.value.file_name || 'analysis_result',
      file_type: analysisResult.value.file_type || 'json',
      create_time: new Date().toISOString()
    });
    
    if (response.data.code === 200) {
      ElMessage.success('分析结果已成功保存到服务器');
      
      // 可选：同时下载到本地
      const jsonStr = JSON.stringify(analysisResult.value, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analysis_${analysisResult.value.file_name || 'result'}.json`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      ElMessage.error(`保存到服务器失败: ${response.data.message || '未知错误'}`);
    }
  } catch (error) {
    console.error('保存分析结果失败:', error);
    ElMessage.error('保存分析结果失败，请检查网络连接或联系管理员');
  }
};

// 查看生成的测试用例
const viewGeneratedTestCases = () => {
  ElMessage.info('此功能正在开发中...');
  // TODO: 实际实现可能需要导航到测试用例页面
};

// 导出测试用例
const exportTestCases = () => {
  if (!hasTestCases.value) {
    ElMessage.warning('没有可导出的测试用例');
    return;
  }
  
  try {
    // 准备要导出的数据
    const testCases = analysisResult.value.deepseek_response.test_cases;
    const exportData = {
      file_name: analysisResult.value.file_name,
      generated_time: new Date().toISOString(),
      test_cases: testCases
    };
    
    // 将数据转换为JSON并创建下载链接
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接并触发下载
    const link = document.createElement('a');
    link.href = url;
    link.download = `test_cases_${analysisResult.value.file_name.replace(/\.[^/.]+$/, '')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    ElMessage.success('测试用例导出成功');
  } catch (error) {
    console.error('导出测试用例失败:', error);
    ElMessage.error('导出测试用例失败');
  }
};

// 文件变更处理
const handleFileChange = (file) => {
  // 检查文件是否已在列表中
  const isDuplicate = uploadFileList.value.some(item => item.name === file.name);
  if (isDuplicate) {
    ElMessage.warning(`文件 ${file.name} 已经存在`);
    return;
  }
  
  // 添加到上传列表
  uploadFileList.value.push(file);
};

// 增强文件变更处理
const handleEnhanceFileChange = (file) => {
  // 检查文件是否已在列表中
  const isDuplicate = enhanceFileList.value.some(item => item.name === file.name);
  if (isDuplicate) {
    ElMessage.warning(`文件 ${file.name} 已经存在`);
    return;
  }
  
  // 添加到上传列表
  enhanceFileList.value.push(file);
};

// 上传文件
const handleUpload = async () => {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件');
    return;
  }
  
  uploading.value = true;
  
  try {
    for (const file of uploadFileList.value) {
      const formData = new FormData();
      formData.append('file', file.raw);
      
      // 获取并添加deepseek配置
      const config = localStorage.getItem('deepseekConfig');
      if (config) {
        const deepseekConfig = JSON.parse(config);
        formData.append('model', deepseekConfig.model);
        formData.append('api_key', deepseekConfig.apiKey);
        formData.append('temperature', deepseekConfig.temperature.toString());
      }
      
      // 调用/api/agent/file/parse接口
      const response = await request.post('/api/agent/file/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.code === 200) {
        ElMessage.success(`文件 ${file.name} 解析成功`);
        
        // 从响应中提取分析结果数据
        const resultData = response.data.data || {};
        
        // 显示分析结果
        analysisResult.value = {
          file_name: resultData.file_name || file.name,
          file_type: resultData.file_type || file.raw.type,
          deepseek_response: resultData.deepseek_response || {},
          sheets: resultData.sheets || []
        };
        
        // 关闭上传对话框并打开分析结果对话框
        dialogVisible.value = false;
        analysisDialogVisible.value = true;
      } else {
        ElMessage.error(`文件 ${file.name} 解析失败: ${response.data.message}`);
      }
    }
    
    // 清空文件列表
    uploadFileList.value = [];
  } catch (error) {
    console.error('上传文件失败:', error);
    ElMessage.error('上传文件失败，请检查网络连接或联系管理员');
  } finally {
    uploading.value = false;
  }
};

// 处理增强上传
const handleEnhanceUpload = async () => {
  if (enhanceFileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件');
    return;
  }
  
  enhanceUploading.value = true;
  
  try {
    for (const file of enhanceFileList.value) {
      const formData = new FormData();
      formData.append('file', file.raw);
      formData.append('enhance', 'true'); // 添加增强标记
      
      // 获取并添加deepseek配置
      const config = localStorage.getItem('deepseekConfig');
      if (config) {
        const deepseekConfig = JSON.parse(config);
        formData.append('model', deepseekConfig.model);
        formData.append('api_key', deepseekConfig.apiKey);
        formData.append('temperature', deepseekConfig.temperature.toString());
      }
      
      // 调用/api/agent/file/parse接口并标记为增强模式
      const response = await request.post('/api/agent/file/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.code === 200) {
        ElMessage.success(`文件 ${file.name} 增强解析成功`);
        
        // 从响应中提取分析结果数据
        const resultData = response.data.data || {};
        
        // 显示分析结果
        analysisResult.value = {
          file_name: resultData.file_name || file.name,
          file_type: resultData.file_type || file.raw.type,
          deepseek_response: resultData.deepseek_response || {},
          sheets: resultData.sheets || []
        };
        
        // 关闭上传对话框并打开分析结果对话框
        enhanceDialogVisible.value = false;
        analysisDialogVisible.value = true;
      } else {
        ElMessage.error(`文件 ${file.name} 增强解析失败: ${response.data.message}`);
      }
    }
    
    // 清空文件列表
    enhanceFileList.value = [];
  } catch (error) {
    console.error('增强上传文件失败:', error);
    ElMessage.error('增强上传文件失败，请检查网络连接或联系管理员');
  } finally {
    enhanceUploading.value = false;
  }
};

// 获取请求方法标签类型
const getMethodTagType = (method) => {
  if (!method) return 'info';
  
  switch (method.toUpperCase()) {
    case 'GET':
      return 'success';
    case 'POST':
      return 'primary';
    case 'PUT':
      return 'warning';
    case 'DELETE':
      return 'danger';
    default:
      return 'info';
  }
};

// 获取优先级标签类型
const getPriorityTagType = (priority) => {
  if (!priority) return 'info';
  
  switch (priority.toLowerCase()) {
    case '高':
    case 'high':
    case 'p0':
    case 'p1':
      return 'danger';
    case '中':
    case 'medium':
    case 'p2':
      return 'warning';
    case '低':
    case 'low':
    case 'p3':
    case 'p4':
      return 'info';
    default:
      return 'info';
  }
};

// 创建单个测试用例
const createTestCase = async (testCase) => {
  if (!testCase) return;
  
  // 为当前操作的行添加loading状态
  testCase.creating = true;
  
  try {
    // 准备测试用例数据，确保符合后端接口要求
    const testCaseData = {
      title: testCase.title,
      api_path: testCase.api_path,
      method: testCase.method,
      priority: testCase.priority,
      // 请求数据处理
      request_data: testCase.body || testCase.request_data || {},
      // 期望响应处理
      expected_response: testCase.expected_result || testCase.expected_response || {},
      description: testCase.description || '由智能测试用例生成',
      source: 'ai_generated',
      tags: ['智能生成'],
      assertions: testCase.assertions || 'json',
      project_id: testCase.project_id || 1 // 添加项目ID
    };
    
    console.log('创建测试用例，发送数据:', testCaseData);
    
    // 调用API创建测试用例
    const response = await request.post('/api/testcase/', testCaseData);
    
    if (response.data.code === 200) {
      ElMessage.success(`测试用例 "${testCase.title}" 创建成功`);
      // 标记为已创建，可以在UI中显示不同状态
      testCase.created = true;
    } else {
      ElMessage.error(`创建失败: ${response.data.message || '未知错误'}`);
    }
  } catch (error) {
    console.error('创建测试用例失败:', error);
    ElMessage.error('创建测试用例失败，请检查网络连接或联系管理员');
  } finally {
    testCase.creating = false;
  }
};

// 批量创建测试用例
const batchCreateTestCases = async () => {
  if (!hasTestCases.value) {
    ElMessage.warning('没有可创建的测试用例');
    return;
  }
  
  batchCreating.value = true;
  tableLoading.value = true;
  
  try {
    const testCases = analysisResult.value.deepseek_response.test_cases;
    const testCasesData = testCases.map(tc => {
      // 构建完整的测试用例数据结构
      return {
        title: tc.title,
        api_path: tc.api_path,
        method: tc.method,
        priority: tc.priority,
        request_data: tc.body || tc.request_data || {},
        expected_response: tc.expected_result || tc.expected_response || {},
        description: tc.description || '由智能测试用例生成',
        source: 'ai_generated',
        tags: ['智能生成'],
        assertions: tc.assertions || 'json',
        project_id: tc.project_id || 1 // 添加项目ID
      };
    });
    
    console.log('批量创建测试用例，发送数据:', { test_cases: testCasesData });
    
    // 调用批量创建API
    const response = await request.post('/api/testcase/batch', {
      test_cases: testCasesData
    });
    
    if (response.data.code === 200) {
      ElMessage.success(`成功创建 ${testCases.length} 个测试用例`);
      
      // 标记所有用例为已创建
      testCases.forEach(tc => {
        tc.created = true;
      });
    } else {
      ElMessage.error(`批量创建失败: ${response.data.message || '未知错误'}`);
    }
  } catch (error) {
    console.error('批量创建测试用例失败:', error);
    ElMessage.error('批量创建测试用例失败，请检查网络连接或联系管理员');
  } finally {
    batchCreating.value = false;
    tableLoading.value = false;
  }
};

// 显示编辑对话框
const editTestCase = (testCase) => {
  currentTestCase.value = JSON.parse(JSON.stringify(testCase)); // 深拷贝测试用例
  
  // 将对象转为格式化的JSON字符串
  try {
    requestDataJson.value = JSON.stringify(testCase.body || testCase.request_data || {}, null, 2);
    expectedResponseJson.value = JSON.stringify(testCase.expected_result || testCase.expected_response || {}, null, 2);
  } catch (error) {
    console.error('格式化JSON失败:', error);
    requestDataJson.value = JSON.stringify({});
    expectedResponseJson.value = JSON.stringify({});
  }
  
  editDialogVisible.value = true;
};

// 保存测试用例编辑
const saveTestCaseEdit = async () => {
  savingEdit.value = true;
  
  try {
    // 解析JSON字符串
    let requestData = {};
    let expectedResponse = {};
    
    try {
      requestData = JSON.parse(requestDataJson.value);
    } catch (error) {
      ElMessage.error('请求数据JSON格式错误');
      savingEdit.value = false;
      return;
    }
    
    try {
      expectedResponse = JSON.parse(expectedResponseJson.value);
    } catch (error) {
      ElMessage.error('预期响应JSON格式错误');
      savingEdit.value = false;
      return;
    }
    
    // 更新测试用例对象
    if (currentTestCase.value) {
      currentTestCase.value.request_data = requestData;
      currentTestCase.value.expected_response = expectedResponse;
      
      // 更新原始列表中的数据
      if (analysisResult.value?.deepseek_response?.test_cases) {
        const index = analysisResult.value.deepseek_response.test_cases.findIndex(
          tc => tc.title === currentTestCase.value.title && tc.api_path === currentTestCase.value.api_path
        );
        
        if (index !== -1) {
          // 更新列表中的数据
          analysisResult.value.deepseek_response.test_cases[index] = JSON.parse(JSON.stringify(currentTestCase.value));
          ElMessage.success('测试用例已更新');
        }
      }
    }
    
    // 关闭对话框
    editDialogVisible.value = false;
  } catch (error) {
    console.error('保存测试用例失败:', error);
    ElMessage.error('保存测试用例失败');
  } finally {
    savingEdit.value = false;
  }
};

// 页面加载时自动加载配置和获取分析列表
onMounted(() => {
  loadConfig();
  getAnalysisList();
});
</script>

<style scoped>
.smart-testcases-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header-actions {
  margin-bottom: 25px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  background-color: #f9fafc;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-actions .el-button {
  margin-right: 0;
  transition: transform 0.2s;
}

.header-actions .el-button:hover {
  transform: translateY(-2px);
}

.content-area {
  text-align: center;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.section-header {
  margin-bottom: 30px;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.section-header p {
  color: #606266;
  font-size: 14px;
}

.upload-container {
  width: 100%;
}

.analysis-list-container {
  margin-top: 20px;
}

.analysis-list-card {
  border-radius: 8px;
  transition: all 0.3s;
}

.analysis-list-card:hover {
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 配置表单样式 */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}

:deep(.el-input-group__append) {
  padding: 0;
}

:deep(.el-slider) {
  margin-top: 12px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  font-weight: 600;
}

:deep(.el-table .el-button--small) {
  padding: 6px 12px;
  font-size: 12px;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #ebeef5;
  padding: 15px 20px;
}

:deep(.el-dialog__body) {
  padding: 20px 25px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #ebeef5;
  padding: 15px 20px;
}

:deep(.el-upload-dragger) {
  border-radius: 8px;
  transition: all 0.3s;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  transform: translateY(-2px);
}

/* 分析结果样式 */
.analysis-dialog {
  min-height: 500px;
}

.analysis-content {
  padding: 15px;
}

.analysis-overview {
  margin-bottom: 30px;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
}

.analysis-summary {
  margin-top: 25px;
  text-align: left;
}

.analysis-summary h3 {
  font-size: 16px;
  margin-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
  font-weight: 600;
  color: #303133;
}

.analysis-formatted-content {
  background-color: #f5f7fa;
  padding: 18px;
  border-radius: 6px;
  line-height: 1.7;
  white-space: pre-line;
  border: 1px solid #ebeef5;
  color: #303133;
  text-align: left;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  overflow-x: auto;
}

.analysis-formatted-content p {
  margin-bottom: 10px;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
}

.sheet-data {
  margin-bottom: 30px;
}

.sheet-table-container {
  margin-top: 15px;
  overflow-x: auto;
  border-radius: 6px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
}

.raw-data {
  margin-top: 30px;
}

.json-preview {
  background-color: #f8f9fb;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  color: #333;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
  max-height: 400px;
  border: 1px solid #ebeef5;
  text-align: left;
  white-space: pre-wrap;
}

.testcase-generation {
  padding: 20px 0;
}

:deep(.el-alert) {
  margin-bottom: 20px;
  border-radius: 6px;
}

.test-cases-list {
  margin: 25px 0;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
}

.no-test-cases {
  padding: 40px 0;
  background-color: #f9fafc;
  border-radius: 6px;
  margin: 25px 0;
  border: 1px dashed #dcdfe6;
}

.action-buttons {
  margin-top: 25px;
  display: flex;
  gap: 15px;
  justify-content: center;
}

.action-buttons .el-button {
  padding: 12px 24px;
  transition: all 0.3s;
}

.action-buttons .el-button:hover {
  transform: translateY(-2px);
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100px 0;
}

/* 分页样式 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 编辑表单样式 */
.edit-test-case-form {
  margin-top: 15px;
}

.edit-test-case-form :deep(.el-form-item) {
  margin-bottom: 22px;
}

.monospace-input :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
  background-color: #f8f9fb;
  border-radius: 6px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .smart-testcases-container {
    padding: 10px;
  }
  
  .header-actions {
    padding: 12px;
    flex-direction: column;
    gap: 8px;
  }
  
  .header-actions .el-button {
    width: 100%;
  }
  
  .content-area {
    padding: 15px;
  }
  
  .analysis-content {
    padding: 5px;
  }
  
  :deep(.el-tabs--border-card) {
    box-shadow: none;
  }
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
  
  .pagination-container {
    justify-content: center;
  }
  
  .edit-test-case-form :deep(.el-form-item__label) {
    float: none;
    display: block;
    text-align: left;
    margin-bottom: 8px;
  }
  
  .edit-test-case-form :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
}

/* 表格中的操作按钮间距 */
.el-button + .el-button {
  margin-left: 5px;
}

/* 添加JSON格式化样式 */
:deep(.el-tab-pane) {
  text-align: left;
}

.analysis-overview {
  margin-bottom: 30px;
  text-align: left;
}

.analysis-content {
  padding: 15px;
  text-align: left;
}
</style> 