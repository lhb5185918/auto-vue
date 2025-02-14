<template>
  <Home>
    <PageContainer title="用例执行">
      <!-- 搜索表单 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="form-inline">
          <el-form-item label="用例名称">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入用例名称"
              clearable
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item label="执行状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择执行状态"
              clearable
              @clear="handleSearch"
            >
              <el-option label="成功" value="success" />
              <el-option label="失败" value="fail" />
              <el-option label="阻塞" value="blocked" />
            </el-select>
          </el-form-item>
          <el-form-item label="执行时间">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>查询
            </el-button>
            <el-button @click="resetSearch">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 操作按钮 -->
      <div class="table-operations">
        <div class="left-operations">
          <el-button type="primary" @click="handleBatchExecute">
            <el-icon><VideoPlay /></el-icon>批量执行
          </el-button>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>导出结果
          </el-button>
        </div>
        <div class="right-operations">
          <span class="env-label">当前环境套：</span>
          <el-select
            v-model="currentEnvId"
            placeholder="请选择环境套"
            style="width: 200px"
            @change="handleEnvChange"
          >
            <el-option
              v-for="item in envList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </div>
      </div>

      <!-- 用例列表 -->
      <el-table
        :data="tableData"
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="用例名称" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="showDetail(row)">{{ row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="执行状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="执行时长" width="120">
          <template #default="{ row }">
            {{ row.duration }}s
          </template>
        </el-table-column>
        <el-table-column prop="executor" label="执行人" width="120" />
        <el-table-column prop="execute_time" label="执行时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.execute_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleExecute(row)">
              执行
            </el-button>
            <el-button link type="primary" @click="showDetail(row)">
              详情
            </el-button>
            <el-button link type="primary" @click="showLog(row)">
              日志
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <!-- 详情抽屉 -->
      <el-drawer
        v-model="detailDrawer.visible"
        :title="detailDrawer.title"
        size="50%"
      >
        <div class="detail-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用例名称">{{ detailDrawer.data.name }}</el-descriptions-item>
            <el-descriptions-item label="执行状态">
              <el-tag :type="getStatusType(detailDrawer.data.status)">
                {{ getStatusText(detailDrawer.data.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="执行时长">{{ detailDrawer.data.duration }}s</el-descriptions-item>
            <el-descriptions-item label="执行人">{{ detailDrawer.data.executor }}</el-descriptions-item>
            <el-descriptions-item label="执行时间">{{ formatDate(detailDrawer.data.execute_time) }}</el-descriptions-item>
            <el-descriptions-item label="错误信息">{{ detailDrawer.data.error_message || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-drawer>

      <!-- 日志抽屉 -->
      <el-drawer
        v-model="logDrawer.visible"
        :title="logDrawer.title"
        size="50%"
      >
        <div class="log-content">
          <pre>{{ logDrawer.content }}</pre>
        </div>
      </el-drawer>
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Search, Refresh, VideoPlay, Download } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import request from '@/utils/request';

// 搜索表单
const searchForm = ref({
  name: '',
  status: '',
  dateRange: [],
  envId: ''
});

// 表格数据
const tableData = ref([]);
const loading = ref(false);
const selectedRows = ref([]);

// 分页
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 详情抽屉
const detailDrawer = ref({
  visible: false,
  title: '用例详情',
  data: {}
});

// 日志抽屉
const logDrawer = ref({
  visible: false,
  title: '执行日志',
  content: ''
});

// 环境套列表
const envList = ref([]);

// 当前选中的环境套
const currentEnvId = ref('');

// 获取环境套列表
const fetchEnvList = async () => {
  try {
    const response = await request.get('/environment/list/');
    envList.value = response.data;
  } catch (error) {
    console.error('获取环境套列表失败:', error);
    ElMessage.error('获取环境套列表失败，请重试');
  }
};

// 获取表格数据
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      name: searchForm.value.name,
      status: searchForm.value.status,
      start_date: searchForm.value.dateRange?.[0],
      end_date: searchForm.value.dateRange?.[1]
    };

    const response = await request.get('/testcase/execution/', { params });
    tableData.value = response.data.items;
    total.value = response.data.total;
  } catch (error) {
    console.error('获取数据失败:', error);
    ElMessage.error('获取数据失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 状态相关方法
const getStatusType = (status) => {
  const map = {
    success: 'success',
    fail: 'danger',
    blocked: 'warning'
  };
  return map[status] || 'info';
};

const getStatusText = (status) => {
  const map = {
    success: '成功',
    fail: '失败',
    blocked: '阻塞'
  };
  return map[status] || '未知';
};

// 日期格式化
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString();
};

// 搜索和重置
const handleSearch = () => {
  currentPage.value = 1;
  fetchData();
};

const resetSearch = () => {
  searchForm.value = {
    name: '',
    status: '',
    dateRange: [],
    envId: ''
  };
  handleSearch();
};

// 表格选择
const handleSelectionChange = (rows) => {
  selectedRows.value = rows;
};

// 分页方法
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchData();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchData();
};

// 处理环境套变更
const handleEnvChange = async (value) => {
  try {
    await request.put('/environment/current/', {
      env_id: value
    });
    ElMessage.success('环境套切换成功');
  } catch (error) {
    console.error('切换环境套失败:', error);
    ElMessage.error('切换环境套失败，请重试');
    // 恢复原值
    currentEnvId.value = '';
  }
};

// 获取当前环境套
const fetchCurrentEnv = async () => {
  try {
    const response = await request.get('/environment/current/');
    currentEnvId.value = response.data.env_id || '';
  } catch (error) {
    console.error('获取当前环境套失败:', error);
    ElMessage.error('获取当前环境套失败，请重试');
  }
};

// 操作方法
const handleExecute = async (row) => {
  if (!currentEnvId.value) {
    ElMessage.warning('请先选择环境套');
    return;
  }

  try {
    await ElMessageBox.confirm('确定要执行该用例吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    loading.value = true;
    await request.post(`/testcase/execution/${row.id}/`, {
      env_id: currentEnvId.value
    });
    ElMessage.success('执行成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('执行失败:', error);
      ElMessage.error('执行失败，请重试');
    }
  } finally {
    loading.value = false;
  }
};

const handleBatchExecute = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要执行的用例');
    return;
  }

  if (!currentEnvId.value) {
    ElMessage.warning('请先选择环境套');
    return;
  }

  try {
    await ElMessageBox.confirm(`确定要执行选中的 ${selectedRows.value.length} 个用例吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    loading.value = true;
    const ids = selectedRows.value.map(row => row.id);
    await request.post('/testcase/execution/batch/', {
      ids,
      env_id: currentEnvId.value
    });
    ElMessage.success('批量执行成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量执行失败:', error);
      ElMessage.error('批量执行失败，请重试');
    }
  } finally {
    loading.value = false;
  }
};

const handleExport = async () => {
  try {
    const response = await request.get('/testcase/execution/export/', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '用例执行结果.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败，请重试');
  }
};

const showDetail = (row) => {
  detailDrawer.value.data = row;
  detailDrawer.value.visible = true;
};

const showLog = async (row) => {
  try {
    const response = await request.get(`/testcase/execution/${row.id}/log/`);
    logDrawer.value.content = response.data.content;
    logDrawer.value.visible = true;
  } catch (error) {
    console.error('获取日志失败:', error);
    ElMessage.error('获取日志失败，请重试');
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchEnvList();
  fetchCurrentEnv();
  fetchData();
});
</script>

<style scoped>
.search-form {
  background: #fff;
  padding: 24px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.form-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

:deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 0;
}

:deep(.el-input),
:deep(.el-select) {
  width: 200px;
}

:deep(.el-date-picker) {
  width: 320px;
}

.table-operations {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-operations {
  display: flex;
  gap: 8px;
}

.right-operations {
  display: flex;
  align-items: center;
  gap: 8px;
}

.env-label {
  font-size: 14px;
  color: #606266;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-content {
  padding: 20px;
}

.log-content {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.log-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
}

:deep(.el-drawer__body) {
  padding: 0;
}

:deep(.el-descriptions) {
  padding: 20px;
}
</style> 