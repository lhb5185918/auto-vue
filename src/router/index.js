import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/Login.vue';
import Index from '@/views/Index.vue';
import Register from '@/views/Register.vue';
import Project from '@/views/Project.vue';
import TestCases from '@/views/TestCases.vue';
import ProjectAnalysis from '@/views/ProjectAnalysis.vue';
import AutomationTest from '@/views/AutomationTest.vue'

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
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;