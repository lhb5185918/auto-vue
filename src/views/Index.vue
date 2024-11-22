<template>
    <Home>
        <div class="content">
            <h1>这是一个内容标题</h1>
            <div class="grid">
                <!-- 第一个区域：项目名称 -->
                <div class="section">
                    <h2>项目名称</h2>
                    <ul>
                        <li v-for="project in projects" :key="project.id">{{ project.name }}</li>
                    </ul>
                </div>

                <!-- 第二个区域：用户统计 -->
                <div class="section">
                    <h2>用户统计</h2>
                    <BarChart :labels="['用例1', '用例2', '用例3']" :data="[100, 200, 150]" />
                </div>

                <!-- 第三个区域：问题统计 -->
                <div class="section">
                    <h2>问题统计</h2>
                    <BarChart :labels="['问题1', '问题2', '问题3']" :data="[5, 10, 3]" />
                </div>

                <!-- 第四个区域：测试报告统计 -->
                <div class="section">
                    <h2>测试报告统计</h2>
                    <BarChart :labels="['报告1', '报告2', '报告3']" :data="[10, 20, 15]" />
                </div>
            </div>
        </div>
    </Home>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Home from '@/components/HomePage.vue';
import BarChart from '@/components/BarChart.vue'; // 导入柱状图组件

const projects = ref([]); // 用于存储项目名称

onMounted(async () => {
    try {
        const response = await fetch('你的API地址'); // 替换为你的API地址
        const data = await response.json();
        projects.value = data.projects; // 假设返回的数据结构中有 projects 数组
    } catch (error) {
        console.error('获取项目名称失败:', error);
    }
});
</script>

<style scoped>
.content {
    padding: 20px;
}

.grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* 每行两个方块 */
    gap: 20px; /* 区域之间的间距 */
}

.section {
    height: 300px; /* 固定高度 */
    padding: 15px;
    border: 1px solid #ccc; /* 边框样式 */
    border-radius: 5px; /* 圆角 */
    background-color: #f9f9f9; /* 背景颜色 */
    display: flex;
    flex-direction: column;
    justify-content: center; /* 垂直居中 */
    align-items: center; /* 水平居中 */
}
</style>