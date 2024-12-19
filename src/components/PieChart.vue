<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
});

const chartCanvas = ref(null);
let chart = null;

const initChart = () => {
  if (chart) {
    chart.destroy();
  }
  
  const ctx = chartCanvas.value.getContext('2d');
  const colors = props.data.map(item => item.color);
  
  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: props.data.map(item => item.name),
      datasets: [{
        data: props.data.map(item => item.value),
        backgroundColor: colors,
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 4
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
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12
            },
            generateLabels: function(chart) {
              const dataset = chart.data.datasets[0];
              const total = dataset.data.reduce((acc, value) => acc + value, 0);
              return chart.data.labels.map((label, index) => {
                const value = dataset.data[index];
                const percentage = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: colors[index],
                  hidden: false,
                  index: index
                };
              });
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const dataset = context.dataset;
              const total = dataset.data.reduce((acc, value) => acc + value, 0);
              const value = dataset.data[context.dataIndex];
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${percentage}% (${value})`;
            }
          }
        }
      }
    }
  });
};

onMounted(() => {
  initChart();
});

watch(
  () => props.data,
  () => {
    initChart();
  },
  { deep: true }
);
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
}

canvas {
  max-width: 100%;
  max-height: 100%;
}
</style> 