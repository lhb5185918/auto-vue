<template>
    <canvas ref="chartCanvas"></canvas>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';

// 注册所需的 Chart.js 组件
Chart.register(...registerables);

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
        default: () => ({
            backgroundColor: ['#409EFF'],
            borderRadius: 0,
            horizontal: false,
            gradient: false,
            title: ''
        })
    }
});

const chartCanvas = ref(null);
let chart = null;

const createChart = () => {
    if (chart) {
        chart.destroy();
    }

    const ctx = chartCanvas.value.getContext('2d');
    
    // 创建渐变色
    const createGradient = (color) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '80');
        return gradient;
    };

    // 设置背景色
    const backgroundColor = props.chartOptions.gradient 
        ? props.chartOptions.backgroundColor.map(color => createGradient(color))
        : props.chartOptions.backgroundColor;

    chart = new Chart(ctx, {
        type: props.chartOptions.horizontal ? 'bar' : 'bar',
        data: {
            labels: props.labels,
            datasets: [{
                data: props.data,
                backgroundColor: backgroundColor,
                borderRadius: props.chartOptions.borderRadius,
                borderWidth: 0,
                maxBarThickness: 50
            }]
        },
        options: {
            indexAxis: props.chartOptions.horizontal ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: !!props.chartOptions.title,
                    text: props.chartOptions.title,
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
};

onMounted(() => {
    createChart();
});

// 监听数据变化
watch([() => props.data, () => props.labels, () => props.chartOptions], () => {
    createChart();
}, { deep: true });
</script>

<style scoped>
canvas {
    width: 100% !important;
    height: 300px !important;
    margin: 0 auto;
}
</style>