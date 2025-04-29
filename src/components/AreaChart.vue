<template>
  <div class="chart-container">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  labels: {
    type: Array,
    required: true
  },
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
    type: 'line',
    data: {
      labels: props.labels,
      datasets: [{
        label: '覆盖率',
        data: props.data,
        fill: true,
        borderColor: props.chartOptions.strokeColor || '#409EFF',
        backgroundColor: props.chartOptions.fillColor ? `${props.chartOptions.fillColor}40` : '#409EFF40',
        tension: props.chartOptions.tension || 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 20,
          right: 20,
          bottom: 25,
          left: 20
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0,0,0,0.75)',
          titleColor: '#fff',
          titleFont: {
            size: 13
          },
          bodyFont: {
            size: 13
          },
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return `覆盖率: ${context.parsed.y}%`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 11
            },
            color: '#909399',
            padding: 5
          }
        },
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: '#f0f0f0'
          },
          ticks: {
            font: {
              size: 11
            },
            color: '#909399',
            padding: 8,
            callback: value => `${value}%`
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      elements: {
        line: {
          borderWidth: 2
        },
        point: {
          hitRadius: 8
        }
      }
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
  padding: 10px 10px 20px 10px;
}

:deep(canvas) {
  border-radius: 4px;
}
</style> 