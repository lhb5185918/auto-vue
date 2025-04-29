<template>
  <div class="chart-container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import Chart from 'chart.js'
// 或者使用 Chart.js 3.x 的新导入方式
import { Chart } from 'chart.js/auto'

export default {
  name: 'LineChart',
  props: {
    chartData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      chart: null,
      config: {
        type: 'line',
        data: {
          labels: [],
          datasets: []
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          // ... 其他配置选项
        }
      }
    }
  },
  methods: {
    initChart() {
      if (!this.chartData || !this.chartData.datasets) {
        console.warn('Chart data is not properly formatted');
        return;
      }

      this.config.data = {
        labels: this.chartData.labels || [],
        datasets: Array.isArray(this.chartData.datasets) ? this.chartData.datasets : []
      };

      if (this.chart) {
        this.chart.destroy();
      }

      const ctx = this.$refs.canvas.getContext('2d');
      this.chart = new Chart(ctx, this.config);
    }
  },
  watch: {
    chartData: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          this.initChart();
        });
      }
    }
  },
  mounted() {
    this.initChart();
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
} 
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;  /* 或者其他合适的高度 */
  width: 100%;
}
</style> 