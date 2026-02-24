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
      title: '调度管理',
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
          title: '调度控制台',
          requiresAuth: true,
        },
      },
      {
        path: 'week',
        name: 'ScheduleWeekView',
        component: () => import('../views/ScheduleWeekView.vue'),
        meta: {
          title: '周视图',
          requiresAuth: true,
        },
      },
    ],
  },
];
