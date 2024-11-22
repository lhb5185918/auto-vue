import { createApp } from 'vue'; // 确保正确导入 createApp
import App from './App.vue';
import router from './router'; // 引入 router
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

// 创建 Vue 应用并挂载
createApp(App)
    .use(router) // 使用 router
    .use(ElementPlus)
    .mount('#app');
