<template>
  <Home>
    <PageContainer title="仪表盘" class="dashboard-container">
      <template #actions>
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>刷新数据
        </el-button>
      </template>

      <div class="dashboard-content">
        <!-- 统计卡片 -->
        <div class="stat-cards">
          <el-card 
            v-for="(stat, index) in statistics" 
            :key="index" 
            class="stat-card" 
            shadow="hover"
          >
            <template #header>
              <div class="card-header">
                <span>{{ stat.title }}</span>
                <el-icon class="icon" :style="{ color: stat.color }">
                  <component :is="stat.icon" />
                </el-icon>
              </div>
            </template>
            <div class="card-content">
              <div class="card-value" :style="{ color: stat.color }">{{ stat.value }}</div>
              <div class="card-label">
                {{ stat.title.includes('率') ? '成功率' : 
                   stat.title.includes('问题') ? '个问题' : '个' }}
              </div>
            </div>
          </el-card>
        </div>

        <!-- 图表区域 -->
        <div class="charts-container">
          <div class="chart-row">
            <el-card class="chart-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>测试用例分布</span>
                </div>
              </template>
              <div class="chart-wrapper">
                <BarChart 
                  :labels="['接口测试', '性能测试', 'UI测试', '安全测试']" 
                  :data="[100, 200, 150, 80]"
                  :chartOptions="{
                    backgroundColor: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C'],
                    borderRadius: 8,
                    title: '测试用例分布',
                    enable3D: true,
                    depth: 20,
                    tooltips: {
                      enabled: true,
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      titleColor: '#fff'
                    }
                  }"
                />
              </div>
            </el-card>
            
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
              <div class="chart-wrapper">
                <LineChart 
                  :data="{
                    labels: trendData.labels,
                    datasets: [
                      {
                        label: '总执行次数',
                        data: trendData.totalCounts,
                        borderColor: '#409EFF',
                        backgroundColor: 'rgba(64, 158, 255, 0.1)',
                        fill: true,
                        tension: 0.4
                      },
                      {
                        label: '成功用例',
                        data: trendData.successCounts,
                        borderColor: '#67C23A',
                        backgroundColor: 'rgba(103, 194, 58, 0.1)',
                        fill: true,
                        tension: 0.4
                      },
                      {
                        label: '失败用例',
                        data: trendData.failCounts,
                        borderColor: '#F56C6C',
                        backgroundColor: 'rgba(245, 108, 108, 0.1)',
                        fill: true,
                        tension: 0.4
                      }
                    ]
                  }"
                  :options="{
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
                            size: 12
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
                        }
                      }
                    }
                  }"
                />
              </div>
            </el-card>
          </div>
          
          <div class="chart-row">
            <el-card class="chart-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>缺陷严重程度分布</span>
                </div>
              </template>
              <div class="chart-wrapper">
                <PieChart
                  :data="[
                    { name: '致命', value: 20, color: '#F56C6C' },
                    { name: '严重', value: 30, color: '#E6A23C' },
                    { name: '一般', value: 40, color: '#409EFF' },
                    { name: '轻微', value: 10, color: '#67C23A' }
                  ]"
                  :options="{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: { 
                          boxWidth: 15,
                          padding: 15
                        }
                      }
                    }
                  }"
                />
              </div>
            </el-card>
            
            <el-card class="chart-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>测试覆盖率趋势</span>
                </div>
              </template>
              <div class="chart-wrapper">
                <AreaChart
                  :labels="['1月', '2月', '3月', '4月', '5月', '6月']"
                  :data="[75, 82, 85, 88, 90, 95]"
                  :chartOptions="{
                    gradient: true,
                    fillColor: '#409EFF',
                    strokeColor: '#409EFF',
                    tension: 0.4,
                    tooltips: true,
                    responsive: true,
                    maintainAspectRatio: false
                  }"
                />
              </div>
            </el-card>
          </div>
        </div>

        <!-- 项目列表 -->
        <el-card class="project-list-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近项目</span>
              <el-button type="primary" link @click="goToProjects">
                查看全部
                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <div class="project-list-container">
            <el-table 
              :data="recentProjects" 
              style="width: 100%" 
              v-loading="loading"
              :height="240"
            >
              <el-table-column prop="name" label="项目名称" min-width="150">
                <template #default="{ row }">
                  <el-link type="primary" @click="goToTestCases(row)">{{ row.name }}</el-link>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" show-overflow-tooltip min-width="200" />
              <el-table-column prop="create_time" label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.create_time) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <el-button-group>
                    <el-button type="primary" link @click="goToTestCases(row)">
                      <el-icon><Document /></el-icon>用例
                    </el-button>
                    <el-button type="primary" link @click="goToAnalysis(row)">
                      <el-icon><TrendCharts /></el-icon>分析
                    </el-button>
                    <el-button type="primary" link @click="goToReport(row)">
                      <el-icon><DataAnalysis /></el-icon>报告
                    </el-button>
                  </el-button-group>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </div>
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import Home from '@/components/HomePage.vue';
import BarChart from '@/components/BarChart.vue';
import PageContainer from '@/components/PageContainer.vue';
import { 
  Refresh, 
  FolderOpened, 
  Files, 
  DataLine, 
  Warning,
  ArrowRight,
  Document,
  TrendCharts,
  DataAnalysis
} from '@element-plus/icons-vue';
import LineChart from '@/components/LineChart.vue';
import PieChart from '@/components/PieChart.vue';
import AreaChart from '@/components/AreaChart.vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const projects = ref([]);
const totalProjects = ref(0);
const recentProjects = ref([]);
const loading = ref(false);
const router = useRouter();

// 添加获取token的方法
const getToken = () => {
  return localStorage.getItem('token') || '';
};

// 添加趋势图相关的响应式数据
const trendTimeRange = ref('week');
const trendData = ref({
  labels: [],
  totalCounts: [],
  successCounts: [],
  failCounts: []
});

// 获取趋势数据的方法
const fetchTrendData = async () => {
  try {
    const response = await request.get('/api/statistics/trend', {
      params: {
        type: trendTimeRange.value
      }
    });

    if (response.data.code === 200) {
      const { data } = response.data;
      trendData.value = {
        labels: data.dates,
        totalCounts: data.total_counts,
        successCounts: data.success_counts,
        failCounts: data.fail_counts
      };
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error);
  }
};

// 监听时间范围变化
watch(trendTimeRange, () => {
  fetchTrendData();
});

// 修改刷新数据的方法
const refreshData = async () => {
  loading.value = true;
  try {
    const response = await request.get('/api/project/');
    if (response.data.code === 200) {
      const { data } = response.data;
      // 更新总项目数
      totalProjects.value = data.total;
      // 更新项目列表
      projects.value = data.projects;
      // 更新最近项目列表（最多显示5个）
      recentProjects.value = data.projects.slice(0, 5);

      // 更新其他统计数据
      const allProjects = data.projects;
      let totalTestCases = 0;
      let totalExecutions = 0;
      let totalSuccessRate = 0;

      allProjects.forEach(project => {
        totalTestCases += project.test_cases_count;
        totalExecutions += project.execution_count;
        totalSuccessRate += project.success_rate;
      });

      // 计算平均成功率
      const avgSuccessRate = allProjects.length > 0 
        ? (totalSuccessRate / allProjects.length).toFixed(1) 
        : 0;

      // 更新统计卡片数据
      statistics.value = [
        {
          title: '总项目数',
          value: data.total,
          icon: 'FolderOpened',
          color: '#409EFF'
        },
        {
          title: '测试用例总数',
          value: totalTestCases,
          icon: 'Files',
          color: '#67C23A'
        },
        {
          title: '执行成功率',
          value: `${avgSuccessRate}%`,
          icon: 'DataLine',
          color: '#67C23A'
        },
        {
          title: '待处理问题',
          value: totalExecutions,
          icon: 'Warning',
          color: '#E6A23C'
        }
      ];

      // 获取趋势数据
      await fetchTrendData();
    } else {
      ElMessage.error(response.data.message || '获取数据失败');
    }
  } catch (error) {
    console.error('获取项目数据失败:', error);
    ElMessage.error('获取数据失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 添加统计数据的响应式引用
const statistics = ref([
  {
    title: '总项目数',
    value: 0,
    icon: 'FolderOpened',
    color: '#409EFF'
  },
  {
    title: '测试用例总数',
    value: 0,
    icon: 'Files',
    color: '#67C23A'
  },
  {
    title: '执行成功率',
    value: '0%',
    icon: 'DataLine',
    color: '#67C23A'
  },
  {
    title: '待处理问题',
    value: 0,
    icon: 'Warning',
    color: '#E6A23C'
  }
]);

onMounted(() => {
  refreshData();
});

// 格式化日期的函数
function formatDate(dateString) {
  const options = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  };
  return new Date(dateString).toLocaleString('zh-CN', options);
}

// 修改跳转函数
const goToTestCases = (row) => {
  router.push({
    path: '/testcases',
    query: {
      projectId: row.id,
      projectName: row.name
    }
  });
};

const goToAnalysis = (row) => {
  router.push({
    path: '/project-analysis',
    query: {
      projectId: row.id,
      projectName: row.name
    }
  });
};

const goToReport = (row) => {
  router.push({
    path: '/execution-report',
    query: {
      projectId: row.id,
      projectName: row.name
    }
  });
};

// 添加跳转到项目列表的函数
const goToProjects = () => {
  router.push('/project');
};
</script>

<style scoped>
.dashboard-container {
  height: auto !important;
  min-height: 100vh;
  overflow-y: auto !important;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 120px; /* 确保底部有足够空间 */
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  width: 100%;
  height: auto;
}

.chart-wrapper {
  height: 380px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-list-card {
  width: 100%;
}

.project-list-container {
  overflow-x: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  text-align: center;
  padding: 12px 0;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.card-label {
  font-size: 14px;
  color: #909399;
}

/* 响应式布局 */
@media (max-width: 1440px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-row {
    grid-template-columns: 1fr;
  }
  
  .chart-wrapper {
    height: 340px;
  }
}

@media (max-width: 768px) {
  .stat-cards {
    grid-template-columns: 1fr;
  }
  
  .chart-wrapper {
    height: 300px;
  }
  
  .dashboard-content {
    padding-bottom: 80px;
  }
}
</style>