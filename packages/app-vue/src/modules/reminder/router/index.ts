/**
 * Reminder 模块路由配置
 */

import type { RouteRecordRaw } from 'vue-router';

export const reminderRoutes: RouteRecordRaw[] = [
  {
    path: '/reminders',
    name: 'reminders',
    meta: {
      title: '提醒管理',
      showInNav: true,
      icon: 'lucide:bell',
      order: 4,
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'reminder-desktop',
        component: () => import('../views/ReminderLinearView.vue'),
        meta: {
          title: '提醒列表',
          requiresAuth: true,
        },
      },
    ],
  },
];
