import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type RouterHistory,
} from 'vue-router';
import { createAuthGuard } from './guards';

import MainLayout from '../layouts/MainLayout.vue';

export function createAppRouter(options?: {
  history?: RouterHistory;
  isAuthenticated?: () => boolean;
  loginRoute?: string;
  additionalRoutes?: RouteRecordRaw[];
}) {
  const { history = createWebHistory(), isAuthenticated, loginRoute, additionalRoutes = [] } =
    options ?? {};

  const routes: RouteRecordRaw[] = [
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/AuthView.vue'),
      meta: { requiresAuth: false, layout: 'auth' },
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'welcome',
          component: () => import('../views/WelcomeView.vue'),
          meta: { title: '首页' },
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { title: '仪表盘' },
        },
        ...additionalRoutes,
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ];

  const router = createRouter({
    history,
    routes,
  });

  router.beforeEach(createAuthGuard({ isAuthenticated, loginRoute }));

  return router;
}

export * from './guards';
