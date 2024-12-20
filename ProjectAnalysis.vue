<template>
  <div class="project-analysis">
    <!-- 其他内容 -->
    <line-chart 
      v-if="chartData.datasets && chartData.datasets.length"
      :chart-data="chartData"
    />
  </div>
</template>

<script>
import LineChart from './LineChart.vue'

export default {
  components: {
    LineChart
  },
  data() {
    return {
      chartData: {
        labels: [],
        datasets: []
      }
    }
  },
  methods: {
    async fetchChartData() {
      try {
        // 假设这是您的API调用
        const response = await this.$api.getProjectAnalysisData()
        
        // 确保数据格式正确
        this.chartData = {
          labels: response.data.labels || [],
          datasets: [{
            label: '测试执行趋势',
            data: response.data.values || [],
            borderColor: '#41B883',
            fill: false
          }]
        }
      } catch (error) {
        console.error('获取图表数据失败:', error)
      }
    }
  },
  mounted() {
    this.fetchChartData()
  }
}
</script> 