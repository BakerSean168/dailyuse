/**
 * Schedule 模块路由配置
 */

import type { RouteRecordRaw } from 'vue-router';

export const scheduleRoutes: RouteRecordRaw[] = [
  {
    path: '/schedule',
    name: 'Schedule',
    redirect: '/schedule/dashboard',
    meta: {
      title: 'schedule.route.management',
      showInNav: true,
      icon: 'mdi-calendar-clock',
      order: 4.5,
      requiresAuth: true,
    },
    children: [
      {
        path: 'dashboard',
        name: 'ScheduleDashboard',
        component: () => import('../views/ScheduleDashboardView.vue'),
        meta: {
          title: 'schedule.route.dashboard',
          requiresAuth: true,
        },
      },
      {
        path: 'week',
        name: 'ScheduleWeekView',
        component: () => import('../views/ScheduleWeekView.vue'),
        meta: {
          title: 'schedule.route.weekView',
          requiresAuth: true,
        },
      },
    ],
  },
];
