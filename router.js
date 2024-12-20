import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/components/HomePage.vue'),
    children: [
      {
        path: '/project-analysis',
        name: 'ProjectAnalysis',
        component: () => import('@/views/ProjectAnalysis.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/project-manage',
        name: 'ProjectManage',
        component: () => import('@/views/ProjectManage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/test-report',
        name: 'TestReport',
        component: () => import('@/views/TestReport.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/system-manage',
        name: 'SystemManage',
        component: () => import('@/views/SystemManage.vue'),
        meta: { requiresAuth: true }
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// 导航守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router 