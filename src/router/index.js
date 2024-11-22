import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/Login.vue'; // 确保路径正确
import Index from '@/views/Index.vue';
import Register from '@/views/Register.vue';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/',
        name: 'Index',
        component: Index
    },
    {
        path: '/register',
        name: 'Register',
        component: Register
    },
    // 其他路由可以在这里添加
];

const router = createRouter({
    history: createWebHistory(), // 使用 HTML5 History 模式
    routes,
});

export default router;