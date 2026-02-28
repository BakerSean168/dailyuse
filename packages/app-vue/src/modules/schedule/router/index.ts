/**
 * Schedule 模块路由配置
 * 日程视图：日视图 / 周视图 / 月视图（统一入口）
 */

import type { RouteRecordRaw } from 'vue-router';

export const scheduleRoutes: RouteRecordRaw[] = [
  {
    path: '/schedule',
    name: 'Schedule',
    redirect: '/schedule/calendar',
    meta: {
      title: 'schedule.route.management',
      showInNav: true,
      icon: 'mdi-calendar-clock',
      order: 4.5,
      requiresAuth: true,
    },
    children: [
      {
        path: 'calendar',
        name: 'ScheduleCalendar',
        component: () => import('../views/ScheduleDashboardView.vue'),
        meta: {
          title: 'schedule.route.calendar',
          requiresAuth: true,
        },
      },
      // Keep week view route for backward compatibility, redirect to calendar
      {
        path: 'week',
        name: 'ScheduleWeekView',
        redirect: '/schedule/calendar',
      },
      {
        path: 'dashboard',
        name: 'ScheduleDashboard',
        redirect: '/schedule/calendar',
      },
    ],
  },
];
