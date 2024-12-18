<template>
  <div class="chart-container">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  chartOptions: {
    type: Object,
    default: () => ({})
  }
});

const chartRef = ref(null);
let chart = null;

const initChart = () => {
  const ctx = chartRef.value.getContext('2d');
  
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: props.data.map(item => item.name),
      datasets: [{
        data: props.data.map(item => item.value),
        backgroundColor: props.chartOptions.colors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 20,
          right: 120,
          bottom: 20,
          left: 20
        }
      },
      plugins: {
        legend: {
          position: 'right',
          align: 'center',
          labels: {
            boxWidth: 15,
            padding: 15,
            font: {
              size: 12
            }
          }
        }
      },
      cutout: '60%'
    }
  });
};

onMounted(() => {
  initChart();
});

watch(() => props.data, () => {
  if (chart) {
    chart.destroy();
    initChart();
  }
}, { deep: true });
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 100%;
  width: 100%;
}
</style> 