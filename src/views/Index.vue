<template>
    <Home>
        <div class="content">
            <h1>仪表盘</h1>
            <div class="grid">
                <!-- 第一个区域：项目名称 -->
                <div class="section">
                    <h2>项目名称</h2>
                    <ul class="project-list">
                        <li v-if="projects.length === 0">没有项目可显示</li>
                        <li v-for="project in projects" :key="project.project_id" class="project-item">
                            <div class="project-details">
                                <strong>{{ project.project_name }}</strong>
                                <span class="date">创建时间: {{ formatDate(project.create_time) }}</span>
                                <span class="date">更新时间: {{ formatDate(project.update_time) }}</span>
                            </div>
                        </li>
                    </ul>
                </div>
                <!-- 其他区域保持不变 -->
                <div class="section" @click="goToTestCases">
                    <h2>测试用例</h2>
                    <BarChart :labels="['用例1', '用例2', '用例3']" :data="[100, 200, 150]" />
                </div>
                <div class="section">
                    <h2>问题统计</h2>
                    <BarChart :labels="['问题1', '问题2', '问题3']" :data="[5, 10, 3]" />
                </div>
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
import { useRouter } from 'vue-router';
import Home from '@/components/HomePage.vue';
import BarChart from '@/components/BarChart.vue'; // 导入柱状图组件

const projects = ref([]); // 用于存储项目名称
const router = useRouter();

onMounted(async () => {
    try {
        const response = await fetch('http://localhost:8000/api/project/'); // 替换为你的API地址
        const data = await response.json();
        projects.value = data.project; // 从返回的数据中获取项目数组
        console.log(projects.value);
    } catch (error) {
        console.error('获取项目名称失败:', error);
    }
});

// 格式化日期的函数
function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(dateString).toLocaleString('zh-CN', options); // 根据需要调整语言和格式
}

// 添加跳转函数
const goToTestCases = () => {
    router.push('/testcases');
};
</script>

<style scoped>
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.content {
    padding: 20px;
    background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    animation: fadeIn 1s ease-in-out;
}

.grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}

.section {
    height: auto;
    padding: 15px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #f9f9f9;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    transition: all 0.3s ease-in-out;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;

    &:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
}

.project-list {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
}

.project-item {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    width: calc(50% - 15px);
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background-color: #fff;
    word-wrap: break-word;
    transition: all 0.3s ease-in-out;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
}

.project-details {
    display: flex;
    flex-direction: column;
}

.date {
    font-size: 14px;
    color: #666;
    margin-top: 5px;
}
</style>