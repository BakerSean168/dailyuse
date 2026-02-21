/**
 * Web App Router - 路由按需注册
 *
 * 仅注册 authentication、account、governance 三个模块路由。
 * 其他模块路由后续按需添加。
 *
 * 设计原则：
 * - 路由级别懒加载 (dynamic import)
 * - 通过 meta.requiresAuth 控制鉴权
 * - 模块路由从各模块的 router/index.ts 导出
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { authGuard } from './guards';
import { progressStart, progressDone } from '@dailyuse/ui-vue-shadcn';

// ============ 模块路由懒导入 ============
// 各模块路由配置中的 component 已使用 () => import() 实现组件级懒加载

import { accountRoutes } from '@/modules/account/presentation/router';
import { governanceRoutes } from '@/modules/governance/presentation/router';

// ============ 应用级路由 ============

const appRoutes: RouteRecordRaw[] = [
  // 认证页面（无需登录）
  {
    path: '/auth',
    name: 'auth',
    component: () => import('@/modules/authentication/presentation/views/AuthView.vue'),
    meta: {
      title: '登录 / 注册',
      requiresAuth: false,
      layout: 'auth',
    },
  },

  // 主布局路由 —— 需要登录
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      // 首页 / 欢迎页
      {
        path: '',
        name: 'home',
        component: () => import('@/views/WelcomeView.vue'),
        meta: { title: '首页' },
      },

      // 注入模块路由 (扁平展开到主布局下)
      ...accountRoutes.flatMap((r) => (r.children ? [{ ...r, component: undefined }] : [r])),
      ...governanceRoutes.flatMap((r) => (r.children ? [{ ...r, component: undefined }] : [r])),
    ],
  },

  // 404 兜底
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面未找到' },
  },
];

// ============ 创建路由实例 ============

const router = createRouter({
  history: createWebHistory(),
  routes: appRoutes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

// ============ 全局守卫 ============

// 路由切换进度条
router.beforeEach(() => {
  progressStart();
});

router.beforeEach(authGuard);

// 页面标题 + 进度条完成
router.afterEach((to) => {
  progressDone();
  const title = to.meta.title as string | undefined;
  document.title = title ? `${title} - DailyUse` : 'DailyUse';
});

export default router;
