<template>
  <div class="chart-container">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Chart } from 'chart.js/auto';

const props = defineProps({
  data: {
    type: Object,
    required: true,
    validator: (value) => {
      return value && value.labels && Array.isArray(value.labels) && 
             value.datasets && Array.isArray(value.datasets);
    }
  }
});

const chartRef = ref(null);
let chart = null;

const initChart = () => {
  if (chart) {
    chart.destroy();
  }

  const ctx = chartRef.value.getContext('2d');
  
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: props.data.labels,
      datasets: props.data.datasets.map(dataset => ({
        ...dataset,
        tension: 0.4,
        borderWidth: 2
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 30,
          right: 20,
          bottom: 25,
          left: 20
        }
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 12,
            padding: 15,
            font: {
              size: 12
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
          grid: {
            color: '#f0f0f0'
          },
          ticks: {
            font: {
              size: 11
            },
            color: '#909399',
            padding: 8
          }
        }
      }
    }
  });
};

onMounted(() => {
  if (props.data && props.data.datasets) {
    initChart();
  }
});

watch(() => props.data, (newVal) => {
  if (newVal && newVal.datasets) {
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