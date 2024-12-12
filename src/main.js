import { createApp } from 'vue'; // 确保正确导入 createApp
import App from './App.vue';
import router from './router'; // 引入 router
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './assets/styles/global.css';
import axios from 'axios'

// 创建 Vue 应用并挂载
createApp(App)
    .use(router) // 使用 router
    .use(ElementPlus)
    .mount('#app');

// 配置axios
app.config.globalProperties.$axios = axios

// 设置基础URL
axios.defaults.baseURL = 'http://localhost:8081'
