import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/Login.vue';
import Index from '@/views/Index.vue';
import Register from '@/views/Register.vue';
import Project from '@/views/Project.vue';
import TestCases from '@/views/TestCases.vue';
import ProjectAnalysis from '@/views/ProjectAnalysis.vue';
import AutomationTest from '@/views/AutomationTest.vue'
import TestPlan from '@/views/TestPlan.vue';
import TestPlanDetail from '@/views/TestPlanDetail.vue';
import ExecutionReport from '@/views/ExecutionReport.vue';
import ApiTestMindMap from '@/views/ApiTestMindMap.vue';
import UserManage from '@/views/UserManage.vue';
import SystemConfig from '@/views/SystemConfig.vue';
import KnowledgeBase from '@/views/KnowledgeBase.vue';

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
        path: '/test-plan-detail',
        name: 'TestPlanDetail',
        component: TestPlanDetail,
        meta: {
            requiresAuth: true,
            title: '测试计划详情'
        }
    },
    {
        path: '/execution-report',
        name: 'ExecutionReport',
        component: ExecutionReport,
        meta: {
            requiresAuth: true,
            title: '执行报告'
        }
    },
    {
        path: '/mindmap/:projectId',
        name: 'ApiTestMindMap',
        component: () => import('@/views/ApiTestMindMap.vue'),
        meta: {
            requiresAuth: true,
            title: '接口自动化脑图'
        }
    },
    {
        path: '/user-manage',
        name: 'UserManage',
        component: UserManage,
        meta: {
            requiresAuth: true,
            title: '用户管理'
        }
    },
    {
        path: '/system-config',
        name: 'SystemConfig',
        component: SystemConfig,
        meta: {
            requiresAuth: true,
            title: '系统配置'
        }
    },
    {
        path: '/knowledge-base',
        name: 'KnowledgeBase',
        component: KnowledgeBase,
        meta: {
            requiresAuth: true,
            title: '知识库管理'
        }
    },
    {
        path: '/knowledge-upload',
        name: 'KnowledgeUpload',
        component: () => import('@/views/KnowledgeUpload.vue'),
        meta: {
            requiresAuth: true,
            title: '知识库文件上传'
        }
    },
    {
        path: '/smart-testcases',
        name: 'SmartTestcases',
        component: () => import('@/views/SmartTestcases.vue'),
        meta: {
            requiresAuth: true,
            title: '智能测试用例维护'
        }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;