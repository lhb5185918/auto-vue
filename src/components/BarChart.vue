<template>
    <div>
        <canvas ref="barChart"></canvas>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps({
    labels: {
        type: Array,
        required: true,
    },
    data: {
        type: Array,
        required: true,
    },
});

const barChart = ref(null);

onMounted(() => {
    const ctx = barChart.value.getContext('2d');

    // 定义多样的颜色
    const backgroundColors = [
        'rgba(75, 192, 192, 0.2)',
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)',
    ];

    const borderColors = [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
    ];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: props.labels,
            datasets: [{
                label: '统计数据',
                data: props.data,
                backgroundColor: backgroundColors.slice(0, props.data.length),
                borderColor: borderColors.slice(0, props.data.length),
                borderWidth: 1,
                barThickness: 50, // 设置柱子的宽度
            }],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
                x: {
                    grid: {
                        display: false, // 隐藏 x 轴网格线
                    },
                },
            },
            elements: {
                bar: {
                    borderWidth: 2, // 增加柱子的边框宽度
                },
            },
        },
    });
});
</script>

<style scoped>
canvas {
    max-width: 600px;
    margin: auto;
}
</style>