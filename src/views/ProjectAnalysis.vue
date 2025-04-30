<template>
  <Home>
    <PageContainer title="项目分析">
      <!-- 添加查询表单 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="form-inline">
          <el-form-item label="项目名称">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入项目名称"
              clearable
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item label="项目状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择项目状态"
              clearable
              @clear="handleSearch"
            >
              <el-option label="活跃" :value="0" />
              <el-option label="未活跃" :value="1" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
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

      <!-- 顶部统计卡片 -->
      <div class="stat-cards">
        <el-card v-for="(stat, index) in statistics" :key="index" class="stat-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>{{ stat.title }}</span>
              <el-icon class="icon" :style="{ color: stat.color }">
                <component :is="stat.icon" />
              </el-icon>
            </div>
          </template>
          <div class="card-value" :style="{ color: stat.color }">{{ stat.value }}</div>
          <div class="card-trend">
            <span :class="stat.trend >= 0 ? 'up' : 'down'">
              {{ Math.abs(stat.trend) }}% 
              <el-icon><component :is="stat.trend >= 0 ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
            </span>
            较上周
          </div>
        </el-card>
      </div>

      <!-- 图表展示区域 -->
      <div class="charts-container">
        <el-row :gutter="20">
          <!-- 执行趋势图 -->
          <el-col :span="12">
            <el-card class="chart-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>测试执行趋势</span>
                  <el-radio-group v-model="trendTimeRange" size="small">
                    <el-radio-button label="week">周</el-radio-button>
                    <el-radio-button label="month">月</el-radio-button>
                  </el-radio-group>
                </div>
              </template>
              <LineChart 
                :data="executionTrendData"
                :options="lineChartOptions"
              />
            </el-card>
          </el-col>

          <!-- 通过率分布图 -->
          <el-col :span="12">
            <el-card class="chart-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>缺陷严重程度分布</span>
                </div>
              </template>
              <PieChart 
                :data="[
                  { name: '致命', value: 20, color: '#F56C6C' },
                  { name: '严重', value: 30, color: '#E6A23C' },
                  { name: '一般', value: 40, color: '#409EFF' },
                  { name: '轻微', value: 10, color: '#67C23A' }
                ]"
              />
            </el-card>
          </el-col>
        </el-row>

        <!-- 测试用例执行情况轮播 -->
        <el-card class="execution-list" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近执行记录</span>
              <el-button type="primary" link>查看全部</el-button>
            </div>
          </template>
          <el-carousel 
            height="240px" 
            :interval="3000" 
            indicator-position="none"
            direction="vertical"
            :autoplay="true"
          >
            <el-carousel-item v-for="(group, index) in executionRecords" :key="index">
              <div class="execution-group">
                <div v-for="record in group" :key="record.id" class="execution-item">
                  <div class="execution-info">
                    <el-tag :type="record.status === 'passed' ? 'success' : 'danger'" size="small">
                      {{ record.status === 'passed' ? '通过' : '失败' }}
                    </el-tag>
                    <span class="case-name">{{ record.caseName }}</span>
                  </div>
                  <div class="execution-time">{{ record.executeTime }}</div>
                </div>
              </div>
            </el-carousel-item>
          </el-carousel>
        </el-card>
      </div>
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  DataLine, 
  Timer, 
  CircleCheck, 
  Warning,
  ArrowUp,
  ArrowDown,
  Search,
  Refresh
} from '@element-plus/icons-vue';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import LineChart from '@/components/LineChart.vue';
import PieChart from '@/components/PieChart.vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';

// 统计数据
const statistics = ref([
  {
    title: '总执行次数',
    value: '1,286',
    icon: 'DataLine',
    color: '#409EFF',
    trend: 12.5
  },
  {
    title: '平均执行时长',
    value: '1.5s',
    icon: 'Timer',
    color: '#67C23A',
    trend: -5.2
  },
  {
    title: '通过率',
    value: '98.5%',
    icon: 'CircleCheck',
    color: '#67C23A',
    trend: 2.3
  },
  {
    title: '失败用例',
    value: '12',
    icon: 'Warning',
    color: '#F56C6C',
    trend: -8.5
  }
]);

// 时间范围选择
const trendTimeRange = ref('week');

// 执行趋势数据
const executionTrendData = ref({
  labels: ['周一', '周二', '周三', '��四', '周五', '周六', '周日'],
  datasets: [
    {
      label: '总执行次数',
      data: [150, 230, 180, 290, 200, 250, 220],
      borderColor: '#409EFF',
      backgroundColor: 'rgba(64, 158, 255, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      order: 1
    },
    {
      label: '成功用例',
      data: [140, 220, 175, 280, 190, 240, 215],
      borderColor: '#67C23A',
      backgroundColor: 'rgba(103, 194, 58, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      order: 2
    },
    {
      label: '失败用例',
      data: [8, 7, 3, 6, 8, 7, 4],
      borderColor: '#F56C6C',
      backgroundColor: 'rgba(245, 108, 108, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      order: 3
    },
    {
      label: '阻塞用例',
      data: [2, 3, 2, 4, 2, 3, 1],
      borderColor: '#E6A23C',
      backgroundColor: 'rgba(230, 162, 60, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      order: 4
    }
  ]
});

// 通过率分布数据
const passRateData = ref([
  { name: '通过', value: 850, color: '#67C23A' },
  { name: '失败', value: 100, color: '#F56C6C' },
  { name: '阻塞', value: 50, color: '#E6A23C' }
]);

// 执行记录数据
const executionRecords = ref([
  [
    { id: 1, caseName: '登录功��测试', status: 'passed', executeTime: '2024-01-16 15:30:00' },
    { id: 2, caseName: '商品搜索测试', status: 'passed', executeTime: '2024-01-16 15:29:30' },
    { id: 3, caseName: '订单支付流程', status: 'failed', executeTime: '2024-01-16 15:29:00' }
  ],
  [
    { id: 4, caseName: '用户注册测试', status: 'passed', executeTime: '2024-01-16 15:28:30' },
    { id: 5, caseName: '商品详情页测试', status: 'passed', executeTime: '2024-01-16 15:28:00' },
    { id: 6, caseName: '购物车功能测试', status: 'passed', executeTime: '2024-01-16 15:27:30' }
  ]
]);

// 图表配置
const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  plugins: {
    legend: {
      position: 'top',
      align: 'start',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 13
        },
        boxWidth: 8,
        boxHeight: 8
      },
      title: {
        display: true,
        text: '图例说明',
        font: {
          size: 14,
          weight: 'bold'
        },
        padding: {
          bottom: 10
        }
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#303133',
      bodyColor: '#606266',
      borderColor: '#E4E7ED',
      borderWidth: 1,
      padding: 10,
      bodyFont: {
        size: 13
      },
      titleFont: {
        size: 13,
        weight: 'normal'
      },
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          label += context.parsed.y + '个';
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        drawBorder: false,
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          size: 12
        }
      },
      title: {
        display: true,
        text: '用例数量',
        font: {
          size: 13
        }
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 12
        }
      },
      title: {
        display: true,
        text: '日期',
        font: {
          size: 13
        }
      }
    }
  }
};

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 13
        },
        generateLabels: function(chart) {
          const data = chart.data;
          if (data.labels.length && data.datasets.length) {
            return data.labels.map((label, i) => {
              const value = data.datasets[0].data[i];
              const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1) + '%';
              return {
                text: `${label}: ${percentage}`,
                fillStyle: data.datasets[0].backgroundColor[i],
                strokeStyle: data.datasets[0].backgroundColor[i],
                lineWidth: 0,
                hidden: false,
                index: i
              };
            });
          }
          return [];
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#303133',
      bodyColor: '#606266',
      borderColor: '#E4E7ED',
      borderWidth: 1,
      padding: 10,
      bodyFont: {
        size: 13
      },
      titleFont: {
        size: 13,
        weight: 'normal'
      },
      callbacks: {
        label: function(context) {
          const value = context.raw;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${context.label}: ${percentage}% (${value}个)`;
        }
      }
    }
  }
};

// 查询表单数据
const searchForm = ref({
  name: '',
  status: '',
  dateRange: []
});

// 处理查询
const handleSearch = async () => {
  try {
    const params = {
      name: searchForm.value.name,
      status: searchForm.value.status,
      start_date: searchForm.value.dateRange?.[0],
      end_date: searchForm.value.dateRange?.[1]
    };

    const response = await axios.post(
      'http://localhost:8081/api/project/',
      params,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 200) {
      // 处理返回的数据，更新您的分析图表等
      console.log('查询结果:', response.data.data);
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    console.error('查询失败:', error);
    if (error.response && error.response.data) {
      ElMessage.error(error.response.data.message);
    } else {
      ElMessage.error('查询失败，请检查网络连接');
    }
  }
};

// 重置查询条件
const resetSearch = () => {
  searchForm.value = {
    name: '',
    status: '',
    dateRange: []
  };
  handleSearch(); // 重置��自动查询
};

// 页面加载时执行查询
onMounted(() => {
  handleSearch();
});
</script>

<style scoped>
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  margin: 12px 0;
}

.card-trend {
  font-size: 13px;
  color: var(--text-secondary);
}

.card-trend .up {
  color: var(--success-color);
}

.card-trend .down {
  color: var(--danger-color);
}

.charts-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-card {
  height: 400px;
}

.execution-list {
  margin-top: 20px;
}

.execution-group {
  padding: 0 20px;
}

.execution-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}

.execution-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.case-name {
  color: var(--text-regular);
}

.execution-time {
  color: var(--text-secondary);
  font-size: 13px;
}

:deep(.el-carousel__container) {
  height: 240px;
}

:deep(.el-carousel__item) {
  overflow-y: hidden;
}

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

.analysis-content {
  background: #fff;
  padding: 24px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-button) {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style> 