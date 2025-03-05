import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/Login.vue';
import Index from '@/views/Index.vue';
import Register from '@/views/Register.vue';
import Project from '@/views/Project.vue';
import TestCases from '@/views/TestCases.vue';
import ProjectAnalysis from '@/views/ProjectAnalysis.vue';
import AutomationTest from '@/views/AutomationTest.vue'
import TestPlan from '@/views/TestPlan.vue';
import ApiTestMindMap from '@/views/ApiTestMindMap.vue';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/',
        name: 'Index',
        component: Index,
        meta: {
            requiresAuth: true
        }
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
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: {
            requiresAuth: true,
            title: '个人中心'
        }
    },
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: {
            requiresAuth: true,
            title: '系统设置'
        }
    },
    {
        path: '/testcases',
        name: 'TestCases',
        component: TestCases,
        props: (route) => ({
            projectId: route.query.projectId,
            projectName: route.query.projectName
        }),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/project-analysis',
        name: 'ProjectAnalysis',
        component: ProjectAnalysis
    },
    {
        path: '/execution',
        name: 'TestExecution',
        component: () => import('@/views/TestExecution.vue'),
        meta: {
            title: '用例执行',
            requiresAuth: true
        }
    },
    {
        path: '/automation',
        name: 'AutomationTest',
        component: AutomationTest,
        meta: {
            requiresAuth: true,
            title: '接口自动化'
        }
    },
    {
        path: '/refresh',
        name: 'Refresh',
        component: {
            beforeRouteEnter(to, from, next) {
                next(vm => {
                    const { redirect, ...query } = to.query;
                    router.replace({
                        path: redirect,
                        query
                    });
                });
            },
            render: () => null
        }
    },
    {
        path: '/test-plan',
        name: 'TestPlan',
        component: TestPlan
    },
    {
        path: '/mindmap/:projectId',
        name: 'ApiTestMindMap',
        component: () => import('@/views/ApiTestMindMap.vue'),
        meta: {
            requiresAuth: true,
            title: '接口自动化脑图'
        }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;