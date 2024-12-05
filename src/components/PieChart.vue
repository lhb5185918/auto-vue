<template>
  <canvas ref="chartCanvas"></canvas>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Chart } from 'chart.js/auto';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  options: {
    type: Object,
    default: () => ({})
  }
});

const chartCanvas = ref(null);
let chart = null;

const createChart = () => {
  if (chart) {
    chart.destroy();
  }

  const ctx = chartCanvas.value.getContext('2d');
  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: props.data.map(item => item.name),
      datasets: [{
        data: props.data.map(item => item.value),
        backgroundColor: props.data.map(item => item.color)
      }]
    },
    options: {
      ...props.options,
      responsive: true,
      maintainAspectRatio: false
    }
  });
};

onMounted(() => {
  createChart();
});

watch(() => props.data, () => {
  createChart();
}, { deep: true });
</script>

<style scoped>
canvas {
  width: 100% !important;
  height: 100% !important;
}
</style> 