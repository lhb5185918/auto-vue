<template>
  <Home>
    <PageContainer :title="'执行报告: ' + (planName || '')">
      <div v-loading="loading">
        <!-- 执行概览卡片 -->
        <el-card class="report-card" v-if="hasExecutionData">
          <template #header>
            <div class="card-header">
              <h3>执行概览</h3>
              <div class="header-actions">
                <el-button @click="goToTestPlan">返回测试计划</el-button>
                <el-button type="primary" @click="exportReport" :loading="exporting">
                  导出报告
                </el-button>
                <el-button type="success" @click="analyzeWithAI" :disabled="!hasExecutionData">
                  <el-icon><Connection /></el-icon>AI分析
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
                      <el-tag :type="getStatusType(executionData.status)" size="large">
                        {{ getStatusText(executionData.status) }}
                      </el-tag>
                    </div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="metric-card">
                    <div class="metric-title">成功率</div>
                    <div class="metric-value success-rate">
                      {{ executionData.success_rate || 0 }}%
                    </div>
                    <el-progress 
                      :percentage="executionData.success_rate || 0" 
                      :status="getProgressStatus(executionData.success_rate || 0)"
                    />
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="metric-card">
                    <div class="metric-title">执行时长</div>
                    <div class="metric-value execution-time">
                      {{ formatDuration(executionData.duration) }}
                    </div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="metric-card">
                    <div class="metric-title">用例总数</div>
                    <div class="metric-value total-cases">
                      {{ executionData.total_cases || 0 }}
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
            
            <div class="execution-info">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="执行ID">{{ executionData.execution_id }}</el-descriptions-item>
                <el-descriptions-item label="计划名称">{{ planName }}</el-descriptions-item>
                <el-descriptions-item label="开始时间">{{ formatDate(executionData.start_time) }}</el-descriptions-item>
                <el-descriptions-item label="结束时间">{{ formatDate(executionData.end_time) }}</el-descriptions-item>
                <el-descriptions-item label="触发方式">{{ executionData.trigger_type || '手动触发' }}</el-descriptions-item>
                <el-descriptions-item label="执行人">{{ executionData.executor || '-' }}</el-descriptions-item>
              </el-descriptions>
            </div>
            
            <div class="results-summary">
              <div class="chart-container">
                <div ref="chartRef" style="width: 100%; height: 250px;"></div>
              </div>
            </div>
          </div>
        </el-card>
        
        <!-- 没有执行数据时的历史列表 -->
        <el-card class="report-card" v-if="!executionId">
          <template #header>
            <div class="card-header">
              <h3>{{ planName ? `"${planName}" 的执行历史` : '执行历史' }}</h3>
              <el-button @click="goToTestPlanList">返回列表</el-button>
            </div>
          </template>
          
          <el-table :data="executionHistory" style="width: 100%">
            <el-table-column prop="execution_id" label="执行ID" width="80" />
            <el-table-column prop="start_time" label="开始时间" width="180" />
            <el-table-column prop="end_time" label="结束时间" width="180" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="duration" label="执行时长" width="120">
              <template #default="{ row }">
                {{ formatDuration(row.duration) }}
              </template>
            </el-table-column>
            <el-table-column prop="success_rate" label="成功率" width="120">
              <template #default="{ row }">
                <el-progress 
                  :percentage="row.success_rate" 
                  :status="getProgressStatus(row.success_rate)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="trigger_type" label="触发方式" width="120" />
            <el-table-column prop="executor" label="执行人" width="120" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button 
                  type="primary"
                  link
                  @click="viewReportDetail(row)"
                >
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="totalHistory"
              :page-sizes="[10, 20, 50, 100]"
              background
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
        
        <!-- 执行详情：测试用例结果 -->
        <el-card class="report-card" v-if="hasExecutionData">
          <template #header>
            <div class="card-header">
              <h3>测试用例结果</h3>
              <div class="filter-container">
                <el-select v-model="statusFilter" placeholder="状态过滤" clearable>
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
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import request from '@/utils/request';
import { formatDate } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const exporting = ref(false);
const executionData = ref({});
const testResults = ref([]);
const executionHistory = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalHistory = ref(0);
const statusFilter = ref('');
const chartRef = ref(null);
let chart = null;

// 从路由参数获取数据
const executionId = ref(route.query.executionId);
const planId = ref(route.query.planId);
const planName = ref(route.query.planName);

// 是否有执行数据
const hasExecutionData = computed(() => {
  return !!executionId.value && Object.keys(executionData.value).length > 0;
});

// 根据状态过滤测试结果
const filteredTestResults = computed(() => {
  if (!statusFilter.value) return testResults.value;
  return testResults.value.filter(result => result.status === statusFilter.value);
});

// 获取执行详情
const fetchExecutionData = async () => {
  loading.value = true;
  try {
    const response = await request.get(`/api/execution/${executionId.value}`);
    
    if (response.data.code === 200) {
      executionData.value = response.data.data;
      await fetchTestResults();
      
      // 初始化图表
      nextTick(() => {
        initChart();
      });
    }
  } catch (error) {
    console.error('获取执行详情失败:', error);
    ElMessage.error('获取执行详情失败');
  } finally {
    loading.value = false;
  }
};

// 获取测试结果列表
const fetchTestResults = async () => {
  try {
    const response = await request.get(`/api/execution/${executionId.value}/results`);
    
    if (response.data.code === 200) {
      testResults.value = response.data.data || [];
    }
  } catch (error) {
    console.error('获取测试结果失败:', error);
    ElMessage.error('获取测试结果失败');
  }
};

// 获取执行历史列表
const fetchExecutionHistory = async () => {
  loading.value = true;
  try {
    const response = await request.get(`/api/test-plan/${planId.value}/executions`, {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    });
    
    if (response.data.code === 200) {
      if (Array.isArray(response.data.data)) {
        executionHistory.value = response.data.data;
        totalHistory.value = response.data.data.length;
      } else {
        executionHistory.value = response.data.data.items || [];
        totalHistory.value = response.data.data.total || 0;
      }
    }
  } catch (error) {
    console.error('获取执行历史失败:', error);
    ElMessage.error('获取执行历史失败');
  } finally {
    loading.value = false;
  }
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchExecutionHistory();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchExecutionHistory();
};

// 查看报告详情
const viewReportDetail = (execution) => {
  router.push({
    path: '/execution-report',
    query: {
      executionId: execution.execution_id,
      planId: planId.value,
      planName: planName.value
    }
  });
};

// 返回测试计划详情页
const goToTestPlan = () => {
  router.push({
    path: '/test-plan-detail',
    query: {
      planId: planId.value
    }
  });
};

// 返回测试计划列表页
const goToTestPlanList = () => {
  router.push('/test-plan');
};

// 导出报告
const exportReport = async () => {
  exporting.value = true;
  try {
    // 使用 window.open 直接打开下载链接
    window.open(`/api/execution/${executionId.value}/export`, '_blank');
    ElMessage.success('报告导出成功');
  } catch (error) {
    console.error('导出报告失败:', error);
    ElMessage.error('导出报告失败');
  } finally {
    exporting.value = false;
  }
};

// 添加AI分析函数
const analyzeWithAI = () => {
  if (!executionId.value) {
    ElMessage.warning('没有可分析的执行数据');
    return;
  }
  
  router.push({
    path: '/ai-analysis-report',
    query: {
      executionId: executionId.value,
      fromReport: true
    }
  });
};

// 初始化结果图表
const initChart = () => {
  if (!chartRef.value) return;
  
  // 销毁已有图表
  if (chart) {
    chart.dispose();
  }
  
  // 创建图表实例
  chart = echarts.init(chartRef.value);
  
  // 准备数据
  const { success_count = 0, failed_count = 0, error_count = 0, skipped_count = 0 } = executionData.value;
  const total = success_count + failed_count + error_count + skipped_count;
  
  // 设置图表配置
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['成功', '失败', '错误', '跳过']
    },
    series: [
      {
        name: '执行结果',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: success_count, name: '成功', itemStyle: { color: '#67C23A' } },
          { value: failed_count, name: '失败', itemStyle: { color: '#F56C6C' } },
          { value: error_count, name: '错误', itemStyle: { color: '#E6A23C' } },
          { value: skipped_count, name: '跳过', itemStyle: { color: '#909399' } }
        ]
      }
    ]
  };
  
  // 渲染图表
  chart.setOption(option);
  
  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    chart.resize();
  });
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

// 获取测试结果类型
const getResultType = (status) => {
  const types = {
    success: 'success',
    failed: 'danger',
    error: 'warning',
    skipped: 'info'
  };
  return types[status] || 'info';
};

// 获取测试结果文本
const getResultText = (status) => {
  const texts = {
    success: '成功',
    failed: '失败',
    error: '错误',
    skipped: '跳过'
  };
  return texts[status] || status;
};

// 获取日志类型
const getLogType = (level) => {
  const types = {
    error: 'danger',
    warn: 'warning',
    info: 'primary',
    debug: 'info'
  };
  return types[level.toLowerCase()] || 'info';
};

// 获取进度条状态
const getProgressStatus = (rate) => {
  if (rate >= 90) return 'success';
  if (rate >= 60) return 'warning';
  return 'exception';
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

onMounted(async () => {
  if (executionId.value) {
    await fetchExecutionData();
  } else if (planId.value) {
    await fetchExecutionHistory();
  } else {
    ElMessage.error('缺少必要的参数');
    router.push('/test-plan');
  }
});
</script>

<style scoped>
.report-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
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

.results-summary {
  margin-top: 20px;
}

.chart-container {
  width: 100%;
  height: 300px;
  background-color: #fff;
  border-radius: 8px;
}

.filter-container {
  display: flex;
  gap: 10px;
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

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

:deep(.el-descriptions__label) {
  font-weight: bold;
}

:deep(.el-timeline-item__timestamp) {
  font-size: 12px;
}

@media screen and (max-width: 768px) {
  .overview-metrics .el-col {
    margin-bottom: 10px;
  }
  
  .header-actions {
    flex-direction: column;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style> 