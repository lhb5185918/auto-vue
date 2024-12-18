<template>
  <Home>
    <PageContainer title="仪表盘">
      <template #actions>
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>刷新数据
        </el-button>
      </template>

      <div class="dashboard-grid">
        <!-- 统计卡片 -->
        <div class="stat-cards">
          <el-card class="stat-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>总项目数</span>
                <el-icon class="icon"><FolderOpened /></el-icon>
              </div>
            </template>
            <div class="card-value">{{ totalProjects }}</div>
          </el-card>

          <el-card class="stat-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>测试用例总数</span>
                <el-icon class="icon"><Files /></el-icon>
              </div>
            </template>
            <div class="card-value">168</div>
          </el-card>

          <el-card class="stat-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>执行成功率</span>
                <el-icon class="icon"><DataLine /></el-icon>
              </div>
            </template>
            <div class="card-value success">98.5%</div>
          </el-card>

          <el-card class="stat-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>待处理问题</span>
                <el-icon class="icon"><Warning /></el-icon>
              </div>
            </template>
            <div class="card-value warning">12</div>
          </el-card>
        </div>

        <!-- 图表区域 -->
        <div class="charts-container">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>测试用例分布</span>
                  </div>
                </template>
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
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>测试执行趋势</span>
                  </div>
                </template>
                <LineChart 
                  :labels="['周一', '周二', '周三', '周四', '周五']"
                  :data="[
                    {
                      label: '通过率',
                      data: [95, 93, 97, 94, 98],
                      borderColor: '#67C23A',
                      fill: true,
                      tension: 0.4
                    },
                    {
                      label: '失败率',
                      data: [5, 7, 3, 6, 2],
                      borderColor: '#F56C6C',
                      fill: true,
                      tension: 0.4
                    }
                  ]"
                />
              </el-card>
            </el-col>
          </el-row>
          
          <el-row :gutter="20" class="mt-20">
            <el-col :span="12">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>缺陷严重程度分布</span>
                  </div>
                </template>
                <PieChart
                  :data="[
                    { value: 20, name: '致命' },
                    { value: 30, name: '严重' },
                    { value: 40, name: '一般' },
                    { value: 10, name: '轻微' }
                  ]"
                  :chartOptions="{
                    colors: ['#F56C6C', '#E6A23C', '#409EFF', '#67C23A'],
                    radius: ['40%', '70%'],
                    center: ['50%', '50%'],
                    enable3D: true
                  }"
                />
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>测试覆盖率趋势</span>
                  </div>
                </template>
                <AreaChart
                  :labels="['1月', '2月', '3月', '4月', '5月', '6月']"
                  :data="[75, 82, 85, 88, 90, 95]"
                  :chartOptions="{
                    gradient: true,
                    fillColor: '#409EFF',
                    strokeColor: '#409EFF',
                    tension: 0.4,
                    tooltips: true
                  }"
                />
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 项目列表 -->
        <el-card class="project-list" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近项目</span>
              <el-button type="primary" link @click="goToProjects">
                查看全部
                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <el-table :data="projects" style="width: 100%" v-loading="loading">
            <el-table-column prop="name" label="项目名称" />
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column prop="create_time" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.create_time) }}
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" link @click="goToTestCases(row)">
                  查看用例
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
  ArrowRight 
} from '@element-plus/icons-vue';
import LineChart from '@/components/LineChart.vue';
import PieChart from '@/components/PieChart.vue';
import AreaChart from '@/components/AreaChart.vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const projects = ref([]); // 用于存储项目名称
const totalProjects = ref(0); // 添加这行
const recentProjects = ref([]); // 添加这行
const loading = ref(false); // 添加加载状态
const router = useRouter();

// 添加获取token的方法
const getToken = () => {
  return localStorage.getItem('token') || '';
};

// 修改刷新数据的方法
const refreshData = async () => {
  loading.value = true;
  try {
    const { data } = await request.get('/project/');
    projects.value = data.projects;
    totalProjects.value = data.total;
    recentProjects.value = data.projects;
  } catch (error) {
    console.error('获取项目数据失败:', error);
  } finally {
    loading.value = false;
  }
};

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

// 添加跳转函数
const goToTestCases = () => {
  router.push('/testcases');
};

// 添加跳转到项目列表的函数
const goToProjects = () => {
  router.push('/project');
};
</script>

<style scoped>
.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
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
  font-size: 16px;
  color: #606266;
}

.icon {
  font-size: 20px;
  color: #909399;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-top: 8px;
}

.card-value.success {
  color: #67C23A;
}

.card-value.warning {
  color: #E6A23C;
}

.charts-container {
  margin-top: 20px;
}

.chart-card {
  height: 380px;
  transition: all 0.3s ease;
}

.chart-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.mt-20 {
  margin-top: 20px;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #ebeef5;
  padding: 15px 20px;
}

:deep(.el-table) {
  margin: -12px;
}

:deep(.el-card__body) {
  padding: 20px;
  height: calc(100% - 60px);
}
</style>