import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type RouterHistory,
} from 'vue-router';
import { createAuthGuard } from './guards';

import MainLayout from '../layouts/MainLayout.vue';

// Module routes
import { accountRoutes } from '../modules/account/router';
import { goalRoutes } from '../modules/goal/router';
import { governanceRoutes } from '../modules/governance/router';
import { taskRoutes } from '../modules/task/router';
import { scheduleRoutes } from '../modules/schedule/router';
import { reminderRoutes } from '../modules/reminder/router';
import { repositoryRoutes } from '../modules/repository/router';
import { notificationRoutes } from '../modules/notification/router';
import { settingRoutes } from '../modules/setting/router';
import { aiRoutes } from '../modules/ai/router';

export function createAppRouter(options?: {
  history?: RouterHistory;
  isAuthenticated?: () => boolean;
  loginRoute?: string;
  authView?: RouteRecordRaw['component'];
  additionalRoutes?: RouteRecordRaw[];
  additionalTopLevelRoutes?: RouteRecordRaw[];
}) {
  const {
    history = createWebHistory(),
    isAuthenticated,
    loginRoute,
    authView,
    additionalRoutes = [],
    additionalTopLevelRoutes = [],
  } = options ?? {};

  const routes: RouteRecordRaw[] = [
    ...additionalTopLevelRoutes,
    {
      path: '/auth',
      name: 'auth',
      component: authView ?? (() => import('../views/AuthView.vue')),
      meta: { requiresAuth: false, layout: 'auth' },
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'ai-workspace',
          component: () => import('../modules/ai/views/AIChatView.vue'),
          meta: { title: 'aiAssistant.chatPage.title' },
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { title: 'dashboard.title' },
        },
        // Module routes
        ...accountRoutes,
        ...goalRoutes,
        ...governanceRoutes,
        ...taskRoutes,
        ...scheduleRoutes,
        ...reminderRoutes,
        ...repositoryRoutes,
        ...notificationRoutes,
        ...aiRoutes,
        ...settingRoutes,
        // Host-provided additional routes
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
