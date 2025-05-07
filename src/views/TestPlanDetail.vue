<template>
  <Home>
    <PageContainer :title="'测试计划详情: ' + (planDetail.name || '')">
      <div v-loading="loading">
        <!-- 基本信息卡片 -->
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <h3>基本信息</h3>
              <div class="header-actions">
                <el-button type="primary" @click="executePlan" :loading="executing">
                  立即执行
                </el-button>
                <el-button @click="goBack">返回</el-button>
              </div>
            </div>
          </template>
          
          <el-descriptions :column="2" border>
            <el-descriptions-item label="计划名称">{{ planDetail.name }}</el-descriptions-item>
            <el-descriptions-item label="所属项目">{{ planDetail.projectName }}</el-descriptions-item>
            <el-descriptions-item label="执行方式">
              <el-tag :type="planDetail.scheduleType === 'cron' ? 'warning' : 'info'">
                {{ planDetail.scheduleType === 'cron' ? '定时执行' : '单次执行' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="执行时间">
              {{ formatSchedule(planDetail) }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(planDetail.status)">
                {{ getStatusText(planDetail.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建人">{{ planDetail.creator }}</el-descriptions-item>
            <el-descriptions-item label="失败重试次数">{{ planDetail.retryTimes || 0 }}次</el-descriptions-item>
            <el-descriptions-item label="最后执行时间">
              {{ planDetail.last_run_time ? formatDate(planDetail.last_run_time) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="通知方式" :span="2">
              <el-tag v-if="planDetail.notifyTypes && planDetail.notifyTypes.includes('email')" 
                      type="success" effect="plain" class="notify-tag">邮件</el-tag>
              <el-tag v-if="planDetail.notifyTypes && planDetail.notifyTypes.includes('dingtalk')" 
                      type="primary" effect="plain" class="notify-tag">钉钉</el-tag>
              <el-tag v-if="planDetail.notifyTypes && planDetail.notifyTypes.includes('wecom')" 
                      type="warning" effect="plain" class="notify-tag">企业微信</el-tag>
              <span v-if="!planDetail.notifyTypes || planDetail.notifyTypes.length === 0">无</span>
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">
              {{ planDetail.description || '无描述' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 测试套件卡片 -->
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <h3>包含的测试套件</h3>
            </div>
          </template>
          
          <el-table :data="testSuites" style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="套件名称" min-width="150" />
            <el-table-column prop="case_count" label="用例数量" width="100" />
            <el-table-column prop="priority" label="优先级" width="100">
              <template #default="{ row }">
                <el-tag :type="getPriorityType(row.priority)">
                  {{ getPriorityText(row.priority) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="create_time" label="创建时间" width="180" />
          </el-table>
        </el-card>

        <!-- 执行历史卡片 -->
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <h3>执行历史</h3>
              <el-button type="primary" @click="viewAllReports" plain>查看所有报告</el-button>
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
            <el-table-column prop="success_rate" label="成功率" width="120">
              <template #default="{ row }">
                <el-progress 
                  :percentage="row.success_rate" 
                  :status="getProgressStatus(row.success_rate)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button 
                  type="primary"
                  link
                  @click="viewExecutionReport(row)"
                >
                  查看报告
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import request from '@/utils/request';
import { formatDate } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const executing = ref(false);
const planDetail = ref({});
const testSuites = ref([]);
const executionHistory = ref([]);

// 从路由参数获取计划ID
const planId = ref(route.query.planId);

// 获取测试计划详情
const fetchPlanDetail = async () => {
  loading.value = true;
  try {
    const response = await request.get(`/api/test-plan/${planId.value}`);
    if (response.data.code === 200) {
      planDetail.value = response.data.data;
      // 如果字段名不匹配，进行映射
      if (planDetail.value.plan_id) {
        planDetail.value.id = planDetail.value.plan_id;
      }
      if (planDetail.value.project_id) {
        planDetail.value.projectId = planDetail.value.project_id;
      }
      if (planDetail.value.project_name) {
        planDetail.value.projectName = planDetail.value.project_name;
      }
      if (planDetail.value.schedule_type) {
        planDetail.value.scheduleType = planDetail.value.schedule_type;
      }
      if (planDetail.value.execute_time) {
        planDetail.value.executeTime = planDetail.value.execute_time;
      }
      if (planDetail.value.cron_expression) {
        planDetail.value.cronExpression = planDetail.value.cron_expression;
      }
      if (planDetail.value.retry_times) {
        planDetail.value.retryTimes = planDetail.value.retry_times;
      }
      if (planDetail.value.notify_types) {
        planDetail.value.notifyTypes = planDetail.value.notify_types;
      }
    }
  } catch (error) {
    console.error('获取测试计划详情失败:', error);
    ElMessage.error('获取测试计划详情失败');
  } finally {
    loading.value = false;
  }
};

// 获取测试套件列表
const fetchTestSuites = async () => {
  try {
    const response = await request.get(`/api/test-plan/${planId.value}/suites`);
    if (response.data.code === 200) {
      testSuites.value = response.data.data || [];
    }
  } catch (error) {
    console.error('获取测试套件失败:', error);
    ElMessage.error('获取测试套件失败');
  }
};

// 获取执行历史
const fetchExecutionHistory = async () => {
  try {
    const response = await request.get(`/api/test-plan/${planId.value}/executions`);
    if (response.data.code === 200) {
      executionHistory.value = response.data.data || [];
    }
  } catch (error) {
    console.error('获取执行历史失败:', error);
    ElMessage.error('获取执行历史失败');
  }
};

// 执行测试计划
const executePlan = async () => {
  executing.value = true;
  try {
    const response = await request.post(`/api/test-plan/${planId.value}/execute`);
    if (response.data.code === 200) {
      ElMessage.success('已开始执行');
      
      // 重新获取测试计划详情和执行历史
      await fetchPlanDetail();
      await fetchExecutionHistory();
    }
  } catch (error) {
    console.error('执行测试计划失败:', error);
    ElMessage.error('执行失败');
  } finally {
    executing.value = false;
  }
};

// 返回测试计划列表页
const goBack = () => {
  router.push('/test-plan');
};

// 查看执行报告
const viewExecutionReport = (execution) => {
  router.push({
    path: '/execution-report',
    query: {
      executionId: execution.execution_id,
      planId: planId.value,
      planName: planDetail.value.name
    }
  });
};

// 查看所有报告
const viewAllReports = () => {
  router.push({
    path: '/execution-report',
    query: {
      planId: planId.value,
      planName: planDetail.value.name
    }
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

// 获取优先级类型
const getPriorityType = (priority) => {
  const types = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  };
  return types[priority] || 'info';
};

// 获取优先级文本
const getPriorityText = (priority) => {
  const texts = {
    high: '高',
    medium: '中',
    low: '低'
  };
  return texts[priority] || priority;
};

// 获取进度条状态
const getProgressStatus = (rate) => {
  if (rate >= 90) return 'success';
  if (rate >= 60) return 'warning';
  return 'exception';
};

// 格式化执行时间显示
const formatSchedule = (row) => {
  if (!row) return '';
  
  if (row.scheduleType === 'once' || row.schedule_type === 'once') {
    return formatDate(row.executeTime || row.execute_time);
  }
  return row.cronExpression || row.cron_expression;
};

onMounted(async () => {
  if (!planId.value) {
    ElMessage.error('计划ID不能为空');
    goBack();
    return;
  }
  
  await fetchPlanDetail();
  await fetchTestSuites();
  await fetchExecutionHistory();
});
</script>

<style scoped>
.detail-card {
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

.notify-tag {
  margin-right: 8px;
}

:deep(.el-descriptions__label) {
  font-weight: bold;
  width: 120px;
}

:deep(.el-descriptions__content) {
  line-height: 1.5;
}

:deep(.el-progress) {
  margin-right: 0;
}
</style> 