import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/Login.vue';
import Index from '@/views/Index.vue';
import Register from '@/views/Register.vue';
import Project from '@/views/Project.vue';
import TestCases from '@/views/TestCases.vue';

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
    {
        path: '/project',
        name: 'Project',
        component: Project,
    },
    {
        path: '/project/:projectId/test-cases',
        name: 'TestCases',
        component: () => import('@/views/TestCases.vue'),
        meta: {
            requiresAuth: true,
            title: '测试用例管理'
        }
    },
    {
        path: '/project-analysis',
        name: 'ProjectAnalysis',
        component: () => import('@/views/ProjectAnalysis.vue')
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;