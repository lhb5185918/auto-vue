import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './assets/styles/global.css';
import * as echarts from 'echarts';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const app = createApp(App);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 添加到 Vue 原型链上，方便全局使用
app.config.globalProperties.$echarts = echarts;

app
  .use(router)
  .use(ElementPlus)
  .mount('#app');
