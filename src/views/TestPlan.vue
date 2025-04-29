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
        <el-table-column label="执行时间" width="200">
          <template #default="{ row }">
            <div class="schedule-info">
              <el-tag 
                :type="row.scheduleType === 'cron' ? 'warning' : 'info'"
                size="small"
              >
                {{ row.scheduleType === 'cron' ? '定时' : '单次' }}
              </el-tag>
              <span>{{ formatSchedule(row) }}</span>
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
        <el-table-column label="操作" width="250" fixed="right">
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

          <el-form-item label="选择用例" prop="testCases">
            <el-transfer
              v-model="planForm.testCases"
              :data="availableTestCases"
              :titles="['可选用例', '已选用例']"
              :props="{
                key: 'id',
                label: 'title'
              }"
              filterable
            />
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
  Refresh
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
  testCases: [],
  retryTimes: 0,
  notifyTypes: []
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入计划名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
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
  testCases: [
    { 
      type: 'array', 
      required: true, 
      message: '请选择测试用例', 
      trigger: 'change' 
    }
  ]
};

// 可选的测试用例列表
const availableTestCases = ref([]);

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
      testPlans.value = response.data.data.items;
      total.value = response.data.data.total;
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
  if (row.scheduleType === 'once') {
    return formatDate(row.executeTime);
  }
  return row.cronExpression;
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
    
    const method = planForm.value.id ? 'put' : 'post';
    const url = planForm.value.id 
      ? `/api/test-plan/${planForm.value.id}`
      : '/api/test-plan/';
    
    const response = await request[method](url, planForm.value);
    
    if (response.data.code === 200) {
      ElMessage.success(planForm.value.id ? '更新成功' : '创建成功');
      showDialog.value = false;
      fetchTestPlans();
    }
  } catch (error) {
    console.error('提交测试计划失败:', error);
    ElMessage.error('提交失败');
  }
};

// 显示创建对话框
const showCreateDialog = () => {
  dialogTitle.value = '新建测试计划';
  planForm.value = {
    name: '',
    description: '',
    scheduleType: 'once',
    executeTime: '',
    cronExpression: '',
    testCases: [],
    retryTimes: 0,
    notifyTypes: []
  };
  showDialog.value = true;
};

// 编辑测试计划
const editPlan = (row) => {
  dialogTitle.value = '编辑测试计划';
  planForm.value = { ...row };
  showDialog.value = true;
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
  router.push({
    path: '/execution-report',
    query: {
      planId: row.id,
      planName: row.name
    }
  });
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

onMounted(() => {
  fetchTestPlans();
  fetchTestCases();
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
</style> 