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
            <div class="card-value">{{ projects.length }}</div>
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
                  :labels="['接口测试', '性能测试', 'UI测试']" 
                  :data="[100, 200, 150]"
                  :chartOptions="{
                    backgroundColor: ['#409EFF', '#67C23A', '#E6A23C'],
                    borderRadius: 6,
                    title: '测试用例分布'
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
                <BarChart 
                  :labels="['通过', '失败', '阻塞']" 
                  :data="[85, 10, 5]"
                  :chartOptions="{
                    backgroundColor: ['#67C23A', '#F56C6C', '#909399'],
                    borderRadius: 6,
                    gradient: true,
                    title: '测试结果分布'
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
            <el-table-column prop="project_name" label="项目名称" />
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

const projects = ref([]); // 用于存储项目名称
const router = useRouter();

onMounted(async () => {
    try {
        const response = await fetch('http://localhost:8000/api/project/'); // 替换为你的API地址
        const data = await response.json();
        projects.value = data.project; // 从返回的数据中获取项目数组
        console.log(projects.value);
    } catch (error) {
        console.error('获取项目名称失败:', error);
    }
});

// 格式化日期的函数
function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(dateString).toLocaleString('zh-CN', options); // 根据需要调整语言和格式
}

// 添加跳转函数
const goToTestCases = () => {
    router.push('/testcases');
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
  height: 400px;
}

.project-list {
  margin-top: 20px;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #ebeef5;
  padding: 15px 20px;
}

:deep(.el-table) {
  margin: -12px;
}
</style>