import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: () => import('../views/ArticleDetail.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/admin',
    name: 'Dashboard',
    component: () => import('../views/admin/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/articles',
    name: 'AdminArticleList',
    component: () => import('../views/admin/ArticleList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/articles/new',
    name: 'ArticleCreate',
    component: () => import('../views/admin/ArticleEditor.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/articles/:id/edit',
    name: 'ArticleEdit',
    component: () => import('../views/admin/ArticleEditor.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 浏览器前进/后退（含 router.back()）时恢复之前的滚动位置
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

// Navigation guard for auth
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
