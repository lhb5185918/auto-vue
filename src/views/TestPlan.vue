<template>
  <Home>
    <PageContainer title="测试计划管理">
      <!-- 搜索和操作栏 -->
      <div class="table-header">
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入计划名称"
            prefix-icon="Search"
            clearable
            class="search-input"
          />
          <el-select
            v-model="statusFilter"
            placeholder="执行状态"
            clearable
            class="filter-select"
          >
            <el-option label="未执行" value="pending" />
            <el-option label="执行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="已失败" value="failed" />
          </el-select>
          <el-button 
            type="primary" 
            @click="handleSearch"
            :icon="Search"
          >
            查询
          </el-button>
          <el-button 
            @click="resetSearch"
            :icon="Refresh"
          >
            重置
          </el-button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="operation-container">
        <el-button-group>
          <el-button 
            type="primary" 
            @click="showCreateDialog"
            :icon="Plus"
          >
            新建测试计划
          </el-button>
          <el-button 
            type="success" 
            @click="batchExecute"
            :icon="VideoPlay"
            :disabled="!selectedPlans.length"
          >
            批量执行
          </el-button>
        </el-button-group>
      </div>

      <!-- 测试计划表格 -->
      <el-table 
        :data="testPlans" 
        border 
        style="width: 100%" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="计划名称" min-width="180">
          <template #default="{ row }">
            <el-link type="primary" @click="viewPlanDetail(row)">
              {{ row.name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="执行模式" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="row.scheduleType === 'cron' ? 'warning' : 'info'"
              size="small"
            >
              {{ row.scheduleType === 'cron' ? '定时' : '单次' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="执行时间" width="200">
          <template #default="{ row }">
            <div>
              {{ formatSchedule(row) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.status)"
              effect="light"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_run_time" label="最后执行时间" width="180">
          <template #default="{ row }">
            {{ row.last_run_time ? formatDate(row.last_run_time) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-tooltip content="执行" placement="top">
                <el-button 
                  type="primary"
                  @click="executePlan(row)"
                  :loading="row.executing"
                  :icon="VideoPlay"
                  circle
                />
              </el-tooltip>
              <el-tooltip content="编辑" placement="top">
                <el-button 
                  type="primary" 
                  plain
                  @click="editPlan(row)"
                  :icon="Edit"
                  circle
                />
              </el-tooltip>
              <el-tooltip content="查看报告" placement="top">
                <el-button 
                  type="success" 
                  plain
                  @click="viewReport(row)"
                  :icon="Document"
                  circle
                />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button 
                  type="danger" 
                  plain
                  @click="deletePlan(row)"
                  :icon="Delete"
                  circle
                />
              </el-tooltip>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页器 -->
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

      <!-- 新建/编辑测试计划对话框 -->
      <el-dialog
        :title="dialogTitle"
        v-model="showDialog"
        width="650px"
        :close-on-click-modal="false"
      >
        <el-form
          ref="planFormRef"
          :model="planForm"
          :rules="rules"
          label-width="100px"
        >
          <el-form-item label="计划名称" prop="name">
            <el-input 
              v-model="planForm.name" 
              placeholder="请输入计划名称"
            />
          </el-form-item>
          
          <el-form-item label="所属项目" prop="projectId">
            <el-select 
              v-model="planForm.projectId" 
              placeholder="请选择项目"
              @change="handleProjectChange"
              style="width: 100%"
            >
              <el-option 
                v-for="item in projectList" 
                :key="item.id" 
                :label="item.name" 
                :value="item.id" 
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="planForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入计划描述"
            />
          </el-form-item>

          <el-form-item label="执行方式" prop="scheduleType">
            <el-radio-group v-model="planForm.scheduleType">
              <el-radio-button label="once">单次执行</el-radio-button>
              <el-radio-button label="cron">定时执行</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item 
            v-if="planForm.scheduleType === 'once'"
            label="执行时间" 
            prop="executeTime"
          >
            <el-date-picker
              v-model="planForm.executeTime"
              type="datetime"
              placeholder="选择执行时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              :disabled-date="disabledDate"
              :disabled-hours="disabledHours"
            />
          </el-form-item>

          <el-form-item 
            v-else
            label="Cron 表达式" 
            prop="cronExpression"
          >
            <div class="cron-input">
              <el-input 
                v-model="planForm.cronExpression"
                placeholder="请输入 Cron 表达式"
              >
                <template #append>
                  <el-button @click="showCronHelper">
                    帮助
                  </el-button>
                </template>
              </el-input>
              <div class="cron-preview" v-if="planForm.cronExpression">
                预计执行时间：{{ nextExecutionTime }}
              </div>
            </div>
          </el-form-item>

          <el-form-item label="选择测试套件" prop="testSuites">
            <el-transfer
              v-model="planForm.testSuites"
              :data="availableTestSuites"
              :titles="['可选测试套件', '已选测试套件']"
              :props="{
                key: 'id',
                label: 'name'
              }"
              filterable
            />
            <div class="form-tip" v-if="availableTestSuites.length === 0">
              该项目下暂无可用的测试套件，请先创建测试套件
            </div>
          </el-form-item>

          <el-form-item label="失败重试" prop="retryTimes">
            <el-input-number 
              v-model="planForm.retryTimes" 
              :min="0" 
              :max="3"
              placeholder="失败重试次数"
            />
          </el-form-item>

          <el-form-item label="通知方式" prop="notifyTypes">
            <el-checkbox-group v-model="planForm.notifyTypes">
              <el-checkbox label="email">邮件通知</el-checkbox>
              <el-checkbox label="dingtalk">钉钉通知</el-checkbox>
              <el-checkbox label="wecom">企业微信</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showDialog = false">取消</el-button>
            <el-button type="primary" @click="submitPlan">确定</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 测试报告弹窗 -->
      <el-dialog
        v-model="showReportDialog"
        :title="'测试报告: ' + (currentPlan.name || '')"
        width="80%"
        :destroy-on-close="true"
        :close-on-click-modal="false"
      >
        <div v-loading="reportLoading">
          <!-- 无报告数据时显示 -->
          <div v-if="!hasReportData && !reportLoading" class="no-report-data">
            <el-empty description="暂无测试报告数据" />
          </div>
          
          <!-- 有报告数据时显示 -->
          <div v-if="hasReportData">
            <!-- 执行概览卡片 -->
            <el-card class="report-card" v-if="selectedExecution">
              <template #header>
                <div class="card-header">
                  <h3>执行概览</h3>
                  <div class="header-actions">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="exportReport(selectedExecution)"
                      :loading="exporting"
                    >
                      导出报告
                    </el-button>
                  </div>
                </div>
              </template>
              
              <div class="overview-container">
                <div class="overview-metrics">
                  <el-row :gutter="20">
                    <el-col :span="6">
                      <div class="metric-card">
                        <div class="metric-title">执行状态</div>
                        <div class="metric-value">
                          <el-tag :type="getStatusType(selectedExecution.status)" size="large">
                            {{ getStatusText(selectedExecution.status) }}
                          </el-tag>
                        </div>
                      </div>
                    </el-col>
                    <el-col :span="6">
                      <div class="metric-card">
                        <div class="metric-title">成功率</div>
                        <div class="metric-value success-rate">
                          {{ selectedExecution.success_rate || 0 }}%
                        </div>
                        <el-progress 
                          :percentage="selectedExecution.success_rate || 0" 
                          :status="getProgressStatus(selectedExecution.success_rate || 0)"
                        />
                      </div>
                    </el-col>
                    <el-col :span="6">
                      <div class="metric-card">
                        <div class="metric-title">执行时长</div>
                        <div class="metric-value execution-time">
                          {{ formatDuration(selectedExecution.duration) }}
                        </div>
                      </div>
                    </el-col>
                    <el-col :span="6">
                      <div class="metric-card">
                        <div class="metric-title">用例总数</div>
                        <div class="metric-value total-cases">
                          {{ selectedExecution.total_cases || 0 }}
                        </div>
                      </div>
                    </el-col>
                  </el-row>
                </div>
                
                <div class="case-count-summary">
                  <el-row :gutter="20">
                    <el-col :span="6">
                      <div class="count-item success">
                        <el-icon><Check /></el-icon>
                        <span class="count-label">成功用例</span>
                        <span class="count-value">{{ selectedExecution.success_count || 0 }}</span>
                      </div>
                    </el-col>
                    <el-col :span="6">
                      <div class="count-item failed">
                        <el-icon><Close /></el-icon>
                        <span class="count-label">失败用例</span>
                        <span class="count-value">{{ selectedExecution.failed_count || 0 }}</span>
                      </div>
                    </el-col>
                    <el-col :span="6">
                      <div class="count-item error">
                        <el-icon><Warning /></el-icon>
                        <span class="count-label">错误用例</span>
                        <span class="count-value">{{ selectedExecution.error_count || 0 }}</span>
                      </div>
                    </el-col>
                    <el-col :span="6">
                      <div class="count-item skipped">
                        <el-icon><More /></el-icon>
                        <span class="count-label">跳过用例</span>
                        <span class="count-value">{{ selectedExecution.skipped_count || 0 }}</span>
                      </div>
                    </el-col>
                  </el-row>
                </div>
                
                <div class="execution-info">
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="执行ID">{{ selectedExecution.execution_id }}</el-descriptions-item>
                    <el-descriptions-item label="计划名称">{{ currentPlan.name }}</el-descriptions-item>
                    <el-descriptions-item label="开始时间">{{ formatDate(selectedExecution.start_time) }}</el-descriptions-item>
                    <el-descriptions-item label="结束时间">{{ formatDate(selectedExecution.end_time) }}</el-descriptions-item>
                  </el-descriptions>
                </div>
              </div>
            </el-card>
          
            <!-- 测试套件结果 -->
            <el-card class="report-card" v-if="suiteResults.length > 0">
              <template #header>
                <div class="card-header">
                  <h3>测试套件结果</h3>
                  <div class="filter-container">
                    <el-select v-model="suiteFilter" placeholder="选择套件" clearable size="small">
                      <el-option label="全部套件" value="" />
                      <el-option 
                        v-for="suite in suitesList" 
                        :key="suite"
                        :label="suite" 
                        :value="suite" 
                      />
                    </el-select>
                  </div>
                </div>
              </template>
              
              <el-collapse v-model="activeCollapse">
                <el-collapse-item 
                  v-for="(suite, index) in filteredSuiteResults" 
                  :key="index"
                  :name="index"
                >
                  <template #title>
                    <div class="suite-title">
                      <span>{{ suite.suite_name }}</span>
                      <div class="suite-stats">
                        <el-tag size="small" type="success" class="suite-stat">通过: {{ suite.passed_cases || 0 }}</el-tag>
                        <el-tag size="small" type="danger" class="suite-stat">失败: {{ suite.failed_cases || 0 }}</el-tag>
                        <el-tag size="small" type="warning" class="suite-stat">错误: {{ suite.error_cases || 0 }}</el-tag>
                        <el-tag size="small" type="info" class="suite-stat">跳过: {{ suite.skipped_cases || 0 }}</el-tag>
                        <el-progress 
                          style="width: 120px; margin-left: 10px;"
                          :percentage="suite.pass_rate || 0" 
                          :status="getProgressStatus(suite.pass_rate || 0)"
                          :stroke-width="10"
                        />
                      </div>
                    </div>
                  </template>
                  
                  <el-table 
                    :data="getSuiteTestCases(suite)" 
                    style="width: 100%"
                    :show-header="true"
                  >
                    <el-table-column type="expand">
                      <template #default="props">
                        <div class="case-detail">
                          <div v-if="props.row.error" class="error-detail">
                            <h4>错误信息</h4>
                            <pre>{{ props.row.error }}</pre>
                          </div>
                          <div v-if="props.row.screenshots && props.row.screenshots.length" class="screenshots">
                            <h4>截图</h4>
                            <div class="screenshot-list">
                              <div v-for="(screenshot, index) in props.row.screenshots" :key="index" class="screenshot-item">
                                <el-image 
                                  :src="screenshot" 
                                  :preview-src-list="props.row.screenshots"
                                  fit="contain"
                                />
                              </div>
                            </div>
                          </div>
                          <div v-if="props.row.request || props.row.response" class="request-response">
                            <h4>请求/响应详情</h4>
                            <div class="api-details">
                              <div v-if="props.row.request" class="api-request">
                                <h5>请求信息</h5>
                                <el-descriptions border size="small" :column="1">
                                  <el-descriptions-item label="URL">{{ props.row.request.api_path }}</el-descriptions-item>
                                  <el-descriptions-item label="方法">
                                    <span :class="['method-tag', 'method-' + props.row.method?.toLowerCase()]">
                                      {{ props.row.method }}
                                    </span>
                                  </el-descriptions-item>
                                  <el-descriptions-item label="请求头">
                                    <pre>{{ formatJSON(props.row.request.headers) }}</pre>
                                  </el-descriptions-item>
                                  <el-descriptions-item label="请求体">
                                    <pre>{{ formatJSON(props.row.request.body) }}</pre>
                                  </el-descriptions-item>
                                </el-descriptions>
                              </div>
                              <div v-if="props.row.response" class="api-response">
                                <h5>响应信息</h5>
                                <el-descriptions border size="small" :column="1">
                                  <el-descriptions-item label="状态码">
                                    <span :class="getStatusCodeClass(props.row.response.status_code)">
                                      {{ props.row.response.status_code }}
                                    </span>
                                  </el-descriptions-item>
                                  <el-descriptions-item label="响应时间">{{ props.row.response.response_time }}ms</el-descriptions-item>
                                  <el-descriptions-item label="响应头">
                                    <pre>{{ formatJSON(props.row.response.headers) }}</pre>
                                  </el-descriptions-item>
                                  <el-descriptions-item label="响应体">
                                    <pre>{{ formatJSON(props.row.response.body) }}</pre>
                                  </el-descriptions-item>
                                </el-descriptions>
                              </div>
                            </div>
                            
                            <!-- 提取器结果展示 -->
                            <div v-if="props.row.extractors && props.row.extractors.extracted_variables" class="extractor-result">
                              <h5>提取变量结果</h5>
                              <el-descriptions border size="small" :column="1">
                                <el-descriptions-item 
                                  v-for="(value, key) in props.row.extractors.extracted_variables" 
                                  :key="key"
                                  :label="key"
                                >
                                  <pre>{{ formatJSON(value) }}</pre>
                                </el-descriptions-item>
                              </el-descriptions>
                            </div>
                          </div>
                          <div v-if="props.row.logs && props.row.logs.length" class="logs">
                            <h4>执行日志</h4>
                            <el-timeline>
                              <el-timeline-item
                                v-for="(log, index) in props.row.logs"
                                :key="index"
                                :timestamp="log.time"
                                :type="getLogType(log.level)"
                              >
                                {{ log.message }}
                              </el-timeline-item>
                            </el-timeline>
                          </div>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column prop="title" label="用例名称" min-width="180" />
                    <el-table-column prop="status" label="状态" width="100">
                      <template #default="{ row }">
                        <el-tag :type="getResultType(row.status)">
                          {{ getResultText(row.status) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="duration" label="执行时长" width="120">
                      <template #default="{ row }">
                        {{ formatDuration(row.duration * 1000) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="api_path" label="API路径" min-width="150">
                      <template #default="{ row }">
                        {{ row.api_path || '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="method" label="方法" width="100">
                      <template #default="{ row }">
                        <el-tag v-if="row.method" type="info" effect="plain">{{ row.method }}</el-tag>
                        <span v-else>-</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-collapse-item>
              </el-collapse>
            </el-card>
            
            <!-- 测试结果详情 -->
            <el-card class="report-card" v-if="testResults.length > 0">
              <template #header>
                <div class="card-header">
                  <h3>测试用例列表</h3>
                  <div class="filter-container">
                    <el-select v-model="reportStatusFilter" placeholder="状态过滤" clearable size="small">
                      <el-option label="全部" value="" />
                      <el-option label="成功" value="success" />
                      <el-option label="失败" value="failed" />
                      <el-option label="错误" value="error" />
                      <el-option label="跳过" value="skipped" />
                    </el-select>
                  </div>
                </div>
              </template>
              
              <el-table :data="filteredTestResults" style="width: 100%">
                <el-table-column type="expand">
                  <template #default="props">
                    <div class="case-detail">
                      <div v-if="props.row.error" class="error-detail">
                        <h4>错误信息</h4>
                        <pre>{{ props.row.error }}</pre>
                      </div>
                      <div v-if="props.row.screenshots && props.row.screenshots.length" class="screenshots">
                        <h4>截图</h4>
                        <div class="screenshot-list">
                          <div v-for="(screenshot, index) in props.row.screenshots" :key="index" class="screenshot-item">
                            <el-image 
                              :src="screenshot" 
                              :preview-src-list="props.row.screenshots"
                              fit="contain"
                            />
                          </div>
                        </div>
                      </div>
                      <div v-if="props.row.logs && props.row.logs.length" class="logs">
                        <h4>执行日志</h4>
                        <el-timeline>
                          <el-timeline-item
                            v-for="(log, index) in props.row.logs"
                            :key="index"
                            :timestamp="log.time"
                            :type="getLogType(log.level)"
                          >
                            {{ log.message }}
                          </el-timeline-item>
                        </el-timeline>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="case_id" label="用例ID" width="80" />
                <el-table-column prop="case_name" label="用例名称" min-width="180" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getResultType(row.status)">
                      {{ getResultText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="duration" label="执行时长" width="120">
                  <template #default="{ row }">
                    {{ formatDuration(row.duration) }}
                  </template>
                </el-table-column>
                <el-table-column prop="retry_count" label="重试次数" width="100" />
                <el-table-column prop="start_time" label="开始时间" width="180" />
                <el-table-column prop="suite_name" label="所属套件" width="150" />
              </el-table>
            </el-card>
          </div>
        </div>
      </el-dialog>
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Plus, 
  VideoPlay, 
  Edit, 
  Delete, 
  Document,
  Search,
  Refresh,
  Check,
  Close,
  Warning,
  More
} from '@element-plus/icons-vue';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import request from '@/utils/request';
import { formatDate } from '@/utils/format';
import { parseCron } from '@/utils/cron';

const router = useRouter();
const loading = ref(false);
const testPlans = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const searchKeyword = ref('');
const statusFilter = ref('');
const selectedPlans = ref([]);
const projectId = ref(null);

// 表单相关
const showDialog = ref(false);
const dialogTitle = ref('新建测试计划');
const planFormRef = ref(null);
const planForm = ref({
  name: '',
  description: '',
  scheduleType: 'once',
  executeTime: '',
  cronExpression: '',
  testSuites: [],
  retryTimes: 0,
  notifyTypes: [],
  projectId: 1  // 添加项目ID字段，默认为1
});

// 项目列表
const projectList = ref([]);

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入计划名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  projectId: [
    { required: true, message: '请选择所属项目', trigger: 'change' }
  ],
  scheduleType: [
    { required: true, message: '请选择执行方式', trigger: 'change' }
  ],
  executeTime: [
    { 
      required: true, 
      message: '请选择执行时间', 
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (planForm.value.scheduleType === 'once' && !value) {
          callback(new Error('请选择执行时间'));
        } else {
          callback();
        }
      }
    }
  ],
  cronExpression: [
    {
      required: true,
      message: '请输入 Cron 表达式',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (planForm.value.scheduleType === 'cron' && !value) {
          callback(new Error('请输入 Cron 表达式'));
        } else {
          callback();
        }
      }
    }
  ],
  testSuites: [
    { 
      type: 'array', 
      required: true, 
      message: '请选择测试套件', 
      trigger: 'change' 
    }
  ]
};

// 可选的测试用例列表
const availableTestCases = ref([]);
const availableTestSuites = ref([]);

// 报告弹窗相关
const showReportDialog = ref(false);
const reportLoading = ref(false);
const currentPlan = ref({});
const executionHistory = ref([]);
const selectedExecution = ref(null);
const testResults = ref([]);
const hasReportData = ref(false);
const exporting = ref(false);
const reportStatusFilter = ref('');
// 新增：套件结果和套件过滤相关
const suiteResults = ref([]);
const suiteFilter = ref('');
const activeCollapse = ref([0]); // 默认展开第一个套件

// 获取所有测试套件名称列表
const suitesList = computed(() => {
  const suites = new Set();
  suiteResults.value.forEach(suite => {
    if (suite.suite_name) {
      suites.add(suite.suite_name);
    }
  });
  return Array.from(suites);
});

// 根据套件过滤条件过滤套件结果
const filteredSuiteResults = computed(() => {
  if (!suiteFilter.value) return suiteResults.value;
  return suiteResults.value.filter(suite => suite.suite_name === suiteFilter.value);
});

// 获取指定套件的测试用例
const getSuiteTestCases = (suite) => {
  if (!suite.result_data || !suite.result_data.results) return [];
  return suite.result_data.results;
};

// 新增：格式化JSON数据
const formatJSON = (data) => {
  if (!data) return '{}';
  try {
    if (typeof data === 'string') {
      // 尝试解析JSON字符串
      const parsedData = JSON.parse(data);
      return JSON.stringify(parsedData, null, 2);
    } else {
      // 直接格式化对象
      return JSON.stringify(data, null, 2);
    }
  } catch (e) {
    // 如果解析失败，直接返回原始字符串
    return data;
  }
};

// 获取测试计划列表
const fetchTestPlans = async () => {
  loading.value = true;
  try {
    const response = await request.get('/api/test-plan/', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: searchKeyword.value,
        status: statusFilter.value
      }
    });

    if (response.data.code === 200) {
      // API直接返回数组，不包含分页信息
      testPlans.value = response.data.data;
      total.value = response.data.data.length; // 如果后端没有提供总数，则使用当前返回的长度
      
      // 字段名称映射处理（如果需要）
      testPlans.value = testPlans.value.map(plan => ({
        id: plan.plan_id,
        name: plan.name,
        description: plan.description || '',
        projectId: plan.project_id,
        projectName: plan.project_name,
        scheduleType: plan.schedule_type,
        executeTime: plan.execute_time,
        cronExpression: plan.cron_expression,
        status: plan.status,
        last_run_time: plan.last_run_time,
        creator: plan.creator,
        create_time: plan.create_time
      }));
    }
  } catch (error) {
    console.error('获取测试计划失败:', error);
    ElMessage.error('获取测试计划失败');
  } finally {
    loading.value = false;
  }
};

// 获取可用的测试用例
const fetchTestCases = async () => {
  try {
    const response = await request.get('/api/testcase/all');
    if (response.data.code === 200) {
      availableTestCases.value = response.data.data;
    }
  } catch (error) {
    console.error('获取测试用例失败:', error);
    ElMessage.error('获取测试用例失败');
  }
};

// 获取可用的测试套件
const fetchTestSuites = async () => {
  try {
    console.log('正在获取项目ID为', planForm.value.projectId, '的测试套件');
    // 使用表单中的projectId，而不是固定的项目ID
    const response = await request.get(`/api/suite/list/${planForm.value.projectId}`);
    if (response.data.code === 200) {
      console.log('原始API返回数据:', response.data.data);
      
      // 直接使用data字段，可能API已更改返回格式
      let suites = [];
      
      // 处理不同的API响应格式
      if (Array.isArray(response.data.data)) {
        // 如果直接返回数组
        suites = response.data.data;
      } else if (response.data.data.suites && Array.isArray(response.data.data.suites)) {
        // 如果返回对象包含suites数组
        suites = response.data.data.suites;
      } else if (response.data.data.total !== undefined && response.data.data.suites) {
        // 如果返回分页格式对象
        suites = response.data.data.suites;
      } else {
        console.warn('未能识别的API响应格式:', response.data);
        suites = [];
      }
      
      // 确保每个套件对象都有唯一的id字段
      availableTestSuites.value = suites.map(suite => {
        const item = { ...suite };
        // 确保有id字段作为transfer组件的key
        if (suite.suite_id && !suite.id) {
          item.id = suite.suite_id;
        }
        // 确保有name字段作为显示标签
        if (!item.name && item.suite_name) {
          item.name = item.suite_name;
        }
        return item;
      });
      
      console.log('处理后的测试套件列表:', availableTestSuites.value);
      console.log('测试套件数量:', availableTestSuites.value.length);
      
      // 检查是否存在ID重复的情况
      const idMap = {};
      const duplicateIds = [];
      availableTestSuites.value.forEach(suite => {
        if (idMap[suite.id]) {
          duplicateIds.push(suite.id);
        } else {
          idMap[suite.id] = true;
        }
      });
      
      if (duplicateIds.length > 0) {
        console.warn('发现重复的套件ID:', duplicateIds);
      }
    }
  } catch (error) {
    console.error('获取测试套件失败:', error);
    ElMessage.error('获取测试套件失败');
  }
};

// 计算下次执行时间
const nextExecutionTime = computed(() => {
  if (!planForm.value.cronExpression) return '';
  try {
    return parseCron(planForm.value.cronExpression);
  } catch (e) {
    return '表达式格式错误';
  }
});

// 禁用过去的日期
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7;
};

// 禁用过去的小时
const disabledHours = () => {
  const hours = [];
  if (planForm.value.executeTime) {
    const now = new Date();
    const selected = new Date(planForm.value.executeTime);
    if (selected.toDateString() === now.toDateString()) {
      for (let i = 0; i < now.getHours(); i++) {
        hours.push(i);
      }
    }
  }
  return hours;
};

// 显示 Cron 表达式帮助
const showCronHelper = () => {
  ElMessageBox.alert(
    `Cron 表达式格式：秒 分 时 日 月 周
    
例如：
0 0 10 * * ? - 每天上午10点执行
0 0/30 9-17 * * ? - 朝九晚五工作时间内每半小时执行
0 0 12 ? * WED - 每周三中午12点执行`,
    'Cron 表达式帮助',
    {
      confirmButtonText: '知道了'
    }
  );
};

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger'
  };
  return types[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '未执行',
    running: '执行中',
    completed: '已完成',
    failed: '已失败'
  };
  return texts[status] || status;
};

// 格式化执行时间显示
const formatSchedule = (row) => {
  if (!row) return '';
  
  if (row.scheduleType === 'once' || row.schedule_type === 'once') {
    // 单次执行模式，显示选择的执行时间
    return formatDate(row.executeTime || row.execute_time || '');
  } else {
    // cron执行模式，显示cron表达式
    return row.cronExpression || row.cron_expression || '';
  }
};

// 处理表格选择
const handleSelectionChange = (selection) => {
  selectedPlans.value = selection;
};

// 批量执行
const batchExecute = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要执行选中的 ${selectedPlans.value.length} 个测试计划吗？`,
      '确认执行',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const response = await request.post('/api/test-plan/batch-execute', {
      planIds: selectedPlans.value.map(plan => plan.id)
    });

    if (response.data.code === 200) {
      ElMessage.success('已开始执行');
      fetchTestPlans();
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量执行失败:', error);
      ElMessage.error('执行失败');
    }
  }
};

// 提交测试计划
const submitPlan = async () => {
  if (!planFormRef.value) return;
  
  try {
    await planFormRef.value.validate();
    
    // 过滤掉testSuites中的null和无效值
    const formData = { ...planForm.value };
    formData.testSuites = formData.testSuites.filter(item => item !== null && item !== undefined);
    
    const method = formData.id ? 'put' : 'post';
    const url = formData.id 
      ? `/api/test-plan/${formData.id}`
      : '/api/test-plan/';
    
    const response = await request[method](url, formData);
    
    if (response.data.code === 200) {
      ElMessage.success(formData.id ? '更新成功' : '创建成功');
      showDialog.value = false;
      fetchTestPlans();
    }
  } catch (error) {
    console.error('提交测试计划失败:', error);
    ElMessage.error('提交失败');
  }
};

// 显示创建对话框
const showCreateDialog = async () => {
  dialogTitle.value = '新建测试计划';
  planForm.value = {
    name: '',
    description: '',
    scheduleType: 'once',
    executeTime: '',
    cronExpression: '',
    testSuites: [],
    retryTimes: 0,
    notifyTypes: [],
    projectId: projectList.value.length > 0 ? projectList.value[0].id : 1
  };
  showDialog.value = true;
  
  // 确保获取测试套件列表
  await fetchTestSuites();
};

// 编辑测试计划
const editPlan = async (row) => {
  dialogTitle.value = '编辑测试计划';
  planForm.value = { ...row };
  showDialog.value = true;
  
  // 确保获取选中项目的测试套件列表
  await fetchTestSuites();
};

// 删除测试计划
const deletePlan = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该测试计划吗？删除后无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const response = await request.delete(`/api/test-plan/${row.id}`);
    
    if (response.data.code === 200) {
      ElMessage.success('删除成功');
      fetchTestPlans();
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除测试计划失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

// 执行测试计划
const executePlan = async (row) => {
  try {
    row.executing = true;
    const response = await request.post(`/api/test-plan/${row.id}/execute`);
    
    if (response.data.code === 200) {
      ElMessage.success('已开始执行');
      fetchTestPlans();
    }
  } catch (error) {
    console.error('执行测试计划失败:', error);
    ElMessage.error('执行失败');
  } finally {
    row.executing = false;
  }
};

// 查看测试报告
const viewReport = (row) => {
  showReportDialog.value = true;
  currentPlan.value = row;
  fetchReportData(row.id);
};

// 查看计划详情
const viewPlanDetail = (row) => {
  router.push({
    path: '/test-plan-detail',
    query: {
      planId: row.id
    }
  });
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchTestPlans();
};

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = '';
  statusFilter.value = '';
  handleSearch();
};

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchTestPlans();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchTestPlans();
};

// 获取项目列表
const fetchProjects = async () => {
  try {
    const response = await request.get('/api/project/');
    if (response.data.code === 200) {
      projectList.value = response.data.data.projects;
      // 如果有项目，默认选择第一个
      if (projectList.value.length > 0) {
        planForm.value.projectId = projectList.value[0].id;
        // 获取默认项目的测试套件列表
        await fetchTestSuites();
      }
    }
  } catch (error) {
    console.error('获取项目列表失败:', error);
    ElMessage.error('获取项目列表失败');
  }
};

// 当项目ID变化时重新获取测试套件
const handleProjectChange = () => {
  planForm.value.testSuites = []; // 清空已选测试套件
  fetchTestSuites();
};

// 获取报告数据
const fetchReportData = async (planId) => {
  reportLoading.value = true;
  hasReportData.value = false;
  testResults.value = [];
  suiteResults.value = [];
  
  try {
    const response = await request.get(`/api/test-plan/${planId}/executions`);
    if (response.data.code === 200) {
      // 获取执行历史记录
      executionHistory.value = response.data.data.executions || [];
      
      // 如果有执行历史记录，默认选择第一条
      if (executionHistory.value.length > 0) {
        const firstExecution = executionHistory.value[0];
        selectedExecution.value = mapExecutionData(firstExecution);
        
        // 直接从执行记录中获取套件结果
        if (firstExecution.result_data && firstExecution.result_data.detailed_suite_results) {
          suiteResults.value = firstExecution.result_data.detailed_suite_results || [];
          console.log('套件结果数据:', suiteResults.value);
          
          // 解析测试用例结果
          testResults.value = parseTestResults(firstExecution.result_data);
        }
        
        hasReportData.value = true;
      } else {
        hasReportData.value = false;
      }
    }
  } catch (error) {
    console.error('获取报告数据失败:', error);
    ElMessage.error('获取报告数据失败');
    hasReportData.value = false;
  } finally {
    reportLoading.value = false;
  }
};

// 映射执行数据到统一格式
const mapExecutionData = (rawData) => {
  // 初始化默认结果
  const executionData = {
    execution_id: rawData.result_id,
    start_time: rawData.execution_time,
    end_time: rawData.summary?.end_time || rawData.execution_time,
    status: mapStatus(rawData.status),
    duration: rawData.duration * 1000, // 转换为毫秒
    success_rate: 0,
    total_cases: 0,
    success_count: 0,
    failed_count: 0,
    error_count: 0,
    skipped_count: 0,
    trigger_type: "manual", // 默认值
    executor: rawData.executor
  };
  
  // 优先使用case_count和case_statistics字段（新的API返回格式）
  if (rawData.case_count !== undefined && rawData.case_statistics) {
    executionData.total_cases = rawData.case_count;
    executionData.success_count = rawData.case_statistics.passed || 0;
    executionData.failed_count = rawData.case_statistics.failed || 0;
    executionData.error_count = rawData.case_statistics.error || 0;
    executionData.skipped_count = rawData.case_statistics.skipped || 0;
    
    // 计算成功率
    if (rawData.case_count > 0) {
      executionData.success_rate = Math.round((rawData.case_statistics.passed / rawData.case_count) * 100);
    }
  } 
  // 如果没有新字段，回退到原有字段
  else {
    executionData.total_cases = rawData.total_cases || 0;
    executionData.success_count = rawData.passed_cases || 0;
    executionData.failed_count = rawData.failed_cases || 0;
    executionData.error_count = rawData.error_cases || 0;
    executionData.skipped_count = rawData.skipped_cases || 0;
    executionData.success_rate = rawData.pass_rate || 0;
    
    // 如果使用summary中的数据可能更准确
    if (rawData.summary) {
      executionData.success_rate = rawData.summary.pass_rate || rawData.pass_rate || 0;
      executionData.total_cases = rawData.summary.total_cases || rawData.total_cases || 0;
      executionData.success_count = rawData.summary.passed_cases || rawData.passed_cases || 0;
      executionData.failed_count = rawData.summary.failed_cases || rawData.failed_cases || 0;
      executionData.error_count = rawData.summary.error_cases || rawData.error_cases || 0;
      executionData.skipped_count = rawData.summary.skipped_cases || rawData.skipped_cases || 0;
    }
  }
  
  console.log('映射后的执行数据:', executionData);
  return executionData;
};

// 映射状态值
const mapStatus = (status) => {
  // 将后端的状态值映射为前端使用的状态
  const statusMap = {
    'pass': 'completed',
    'fail': 'failed',
    'error': 'failed',
    'running': 'running',
    'pending': 'pending'
  };
  
  return statusMap[status.toLowerCase()] || status;
};

// 解析测试结果
const parseTestResults = (resultData) => {
  const results = [];
  
  // 遍历套件结果
  if (resultData.detailed_suite_results) {
    resultData.detailed_suite_results.forEach(suite => {
      if (suite.result_data && suite.result_data.results) {
        // 遍历用例结果
        suite.result_data.results.forEach(testCase => {
          results.push({
            case_id: testCase.case_id,
            case_name: testCase.title,
            status: testCase.status.toLowerCase(), // 将状态转为小写
            duration: testCase.duration * 1000, // 转换为毫秒
            retry_count: 0, // 默认值
            start_time: suite.execution_time,
            suite_name: suite.suite_name,
            error: testCase.error || null,
            logs: parseLogs(testCase),
            screenshots: parseScreenshots(testCase),
            // 保留原始请求和响应数据
            request: testCase.request || null,
            response: testCase.response || null,
            // 保存API相关信息
            api_path: testCase.api_path || '',
            method: testCase.method || '',
            // 保存测试结果提取器信息
            extractors: testCase.extractors || null,
          });
        });
      }
    });
  }
  
  return results;
};

// 解析日志
const parseLogs = (testCase) => {
  const logs = [];
  
  // 如果有请求和响应信息，添加为日志
  if (testCase.request && testCase.response) {
    logs.push({
      time: testCase.start_time || new Date().toISOString(),
      level: 'info',
      message: `请求: ${testCase.method} ${testCase.api_path}`
    });
    
    logs.push({
      time: testCase.end_time || new Date().toISOString(),
      level: 'info',
      message: `响应: ${testCase.response.status_code} (${testCase.response.response_time}s)`
    });
  }
  
  // 如果有错误，添加错误日志
  if (testCase.error) {
    logs.push({
      time: new Date().toISOString(),
      level: 'error',
      message: testCase.error
    });
  }
  
  return logs;
};

// 解析截图
const parseScreenshots = (testCase) => {
  // 假设测试用例中可能有截图字段
  return testCase.screenshots || [];
};

// 导出报告
const exportReport = async (execution) => {
  exporting.value = true;
  try {
    // 使用window.open直接下载报告
    window.open(`/api/execution/${execution.execution_id}/export`, '_blank');
    ElMessage.success('报告导出成功');
  } catch (error) {
    console.error('导出报告失败:', error);
    ElMessage.error('导出报告失败');
  } finally {
    exporting.value = false;
  }
};

// 选择执行历史
const selectExecution = (row) => {
  selectedExecution.value = row;
  
  // 查找原始执行记录以获取详细数据
  const originalExecution = executionHistory.value.find(exec => exec.result_id === row.execution_id);
  if (originalExecution && originalExecution.result_data) {
    // 更新套件结果
    suiteResults.value = originalExecution.result_data.detailed_suite_results || [];
    // 解析测试用例结果
    testResults.value = parseTestResults(originalExecution.result_data);
  } else {
    suiteResults.value = [];
    testResults.value = [];
  }
};

// 获取过滤后的测试结果
const filteredTestResults = computed(() => {
  if (!reportStatusFilter.value) return testResults.value;
  return testResults.value.filter(result => result.status === reportStatusFilter.value);
});

// 获取进度状态
const getProgressStatus = (success_rate) => {
  if (success_rate < 50) return 'exception';
  if (success_rate < 80) return 'warning';
  return 'success';
};

// 获取结果类型
const getResultType = (status) => {
  const statusLower = status.toLowerCase();
  const types = {
    success: 'success',
    pass: 'success',
    failed: 'danger',
    fail: 'danger',
    error: 'error',
    skipped: 'info',
    skip: 'info'
  };
  return types[statusLower] || 'info';
};

// 获取结果文本
const getResultText = (status) => {
  const statusLower = status.toLowerCase();
  const texts = {
    success: '成功',
    pass: '成功',
    failed: '失败',
    fail: '失败',
    error: '错误',
    skipped: '跳过',
    skip: '跳过'
  };
  return texts[statusLower] || status;
};

// 获取日志类型
const getLogType = (level) => {
  const types = {
    info: 'info',
    warn: 'warning',
    error: 'error'
  };
  return types[level] || 'info';
};

// 格式化持续时间
const formatDuration = (duration) => {
  if (!duration && duration !== 0) return '-';
  
  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
};

// 获取状态码样式类
const getStatusCodeClass = (statusCode) => {
  if (!statusCode) return '';
  
  const code = parseInt(statusCode);
  if (code >= 200 && code < 300) {
    return 'status-2xx';
  } else if (code >= 300 && code < 400) {
    return 'status-3xx';
  } else if (code >= 400 && code < 500) {
    return 'status-4xx';
  } else if (code >= 500) {
    return 'status-5xx';
  }
  return '';
};

onMounted(() => {
  fetchTestPlans();
  fetchProjects(); // 先获取项目列表
  // 在获取项目列表后，初始化完成时获取测试套件
  // 注意：实际上fetchProjects是异步的，fetchTestSuites会在handleProjectChange中调用
});
</script>

<style scoped>
/* 卡片样式优化 */
:deep(.el-card) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

:deep(.el-card:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

/* 搜索栏样式优化 */
.table-header {
  margin-bottom: 24px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-input {
  width: 300px;
}

.filter-select {
  width: 180px;
}

/* 操作按钮区域样式 */
.operation-container {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.operation-container .el-button-group {
  display: flex;
  gap: 12px;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
  height: 50px;
}

:deep(.el-table td) {
  padding: 12px 0;
}

/* 状态标签样式 */
.schedule-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-tag) {
  border-radius: 4px;
  padding: 0 8px;
  height: 24px;
  line-height: 22px;
}

/* 表格操作按钮样式 */
:deep(.el-button.is-circle) {
  width: 32px;
  height: 32px;
  padding: 8px;
  margin: 0 4px;
}

/* 分页器样式 */
.pagination-container {
  margin-top: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  justify-content: flex-end;
}

/* 对话框样式优化 */
:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  margin: 0;
  padding: 20px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: #f5f7fa;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: #f5f7fa;
}

/* 表单样式优化 */
:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  box-shadow: none;
  border: 1px solid var(--el-border-color);
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  border-color: var(--el-color-primary);
}

/* Cron 表达式输入框样式 */
.cron-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cron-preview {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

/* 测试用例选择器样式 */
:deep(.el-transfer) {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 16px;
}

:deep(.el-transfer__buttons) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
}

:deep(.el-transfer-panel) {
  width: 45%;
  border-radius: 8px;
}

:deep(.el-transfer-panel__header) {
  background-color: #f5f7fa;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

:deep(.el-transfer-panel__body) {
  height: 400px;
}

/* 通知方式选择器样式 */
:deep(.el-checkbox-group) {
  display: flex;
  gap: 24px;
}

/* 空状态样式 */
:deep(.el-empty) {
  padding: 40px 0;
}

/* 报告相关样式 */
.report-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.overview-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.overview-metrics {
  margin-bottom: 20px;
}

.metric-card {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.metric-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.success-rate {
  color: #67C23A;
}

.execution-time {
  color: #409EFF;
}

.total-cases {
  color: #E6A23C;
}

.case-detail {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.error-detail {
  margin-bottom: 20px;
}

.error-detail h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #F56C6C;
}

.error-detail pre {
  background-color: #303133;
  color: #fff;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
  margin: 0;
}

.screenshots h4 {
  margin-top: 20px;
  margin-bottom: 10px;
}

.screenshot-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.screenshot-item {
  width: 200px;
  border: 1px solid #ebeef5;
  border-radius: 5px;
  overflow: hidden;
}

.logs h4 {
  margin-top: 20px;
  margin-bottom: 10px;
}

.filter-container {
  display: flex;
  gap: 10px;
}

.no-report-data {
  display: flex;
  justify-content: center;
  padding: 50px 0;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
  
  .operation-container {
    flex-direction: column;
    gap: 16px;
  }
  
  :deep(.el-transfer) {
    flex-direction: column;
    align-items: stretch;
  }
  
  :deep(.el-transfer-panel) {
    width: 100%;
  }
  
  :deep(.el-transfer__buttons) {
    flex-direction: row;
    justify-content: center;
    padding: 16px 0;
  }
}

/* 动画效果 */
.el-button {
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 表格行悬浮效果 */
:deep(.el-table__row) {
  transition: all 0.3s ease;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

/* 加载状态样式 */
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

/* 工具提示样式 */
:deep(.el-tooltip__popper) {
  border-radius: 4px;
}

/* 选择器下拉菜单样式 */
:deep(.el-select-dropdown) {
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

/* 日期选择器样式 */
:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-date-picker) {
  border-radius: 8px;
}

.form-tip {
  color: #909399;
  font-size: 13px;
  margin-top: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border-left: 3px solid #e6a23c;
}

/* 套件结果相关样式 */
.suite-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 5px 0;
}

.suite-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.suite-stat {
  margin-right: 5px;
}

/* API请求/响应详情样式 */
.request-response {
  margin-top: 20px;
}

.request-response h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #409EFF;
}

.api-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.api-request h5, .api-response h5 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #606266;
}

.api-details pre {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
  font-size: 12px;
  max-height: 200px;
  border-left: 3px solid #409EFF;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* 折叠面板样式 */
:deep(.el-collapse-item__header) {
  font-size: 16px;
  font-weight: 500;
  background-color: #f5f7fa;
  padding: 0 15px;
  border-radius: 4px;
}

:deep(.el-collapse-item__content) {
  padding: 15px;
}

/* 表格展开详情样式 */
.case-detail {
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  margin: 10px 0;
}

.error-detail h4, .screenshots h4, .logs h4 {
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

/* 添加响应状态码颜色 */
.status-2xx {
  color: #67C23A;
  font-weight: bold;
}

.status-3xx {
  color: #E6A23C;
  font-weight: bold;
}

.status-4xx, .status-5xx {
  color: #F56C6C;
  font-weight: bold;
}

/* 增加请求方法标签样式 */
.method-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.method-get {
  background-color: #E1F3D8;
  color: #67C23A;
}

.method-post {
  background-color: #D9ECFF;
  color: #409EFF;
}

.method-put {
  background-color: #FCF4E8;
  color: #E6A23C;
}

.method-delete {
  background-color: #FDE2E2;
  color: #F56C6C;
}

/* 提取器结果展示 */
.extractor-result {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border-left: 3px solid #67C23A;
}

.extractor-result h5 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #67C23A;
}

/* 用例计数样式 */
.case-count-summary {
  margin: 20px 0;
}

.count-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border-top: 3px solid transparent;
  transition: transform 0.3s ease;
}

.count-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.count-item .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.count-item.success .el-icon {
  color: #67C23A;
}

.count-item.failed .el-icon {
  color: #F56C6C;
}

.count-item.error .el-icon {
  color: #E6A23C;
}

.count-item.skipped .el-icon {
  color: #909399;
}

.count-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.count-value {
  font-size: 24px;
  font-weight: bold;
}

.count-item.success {
  border-top-color: #67C23A;
}

.count-item.failed {
  border-top-color: #F56C6C;
}

.count-item.error {
  border-top-color: #E6A23C;
}

.count-item.skipped {
  border-top-color: #909399;
}

/* 测试套件选择器纵向排列样式 */
:deep(.el-transfer-panel__list.el-checkbox-group) {
  display: flex;
  flex-direction: column;
}

:deep(.el-transfer-panel .el-checkbox-group) {
  display: flex;
  flex-direction: column;
}

:deep(.el-transfer-panel .el-checkbox) {
  display: block;
  width: 100%;
  margin-right: 0;
  padding: 8px 15px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-transfer-panel .el-checkbox__label) {
  padding-left: 8px;
}

:deep(.el-transfer-panel .el-checkbox:last-child) {
  border-bottom: none;
}
</style> 