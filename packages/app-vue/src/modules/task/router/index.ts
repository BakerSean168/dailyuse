/**
 * Task 模块路由配置
 */

import type { RouteRecordRaw } from 'vue-router';

export const taskRoutes: RouteRecordRaw[] = [
  {
    path: '/tasks',
    name: 'tasks',
    meta: {
      title: 'task.route.management',
      showInNav: true,
      icon: 'mdi-check-circle',
      order: 2,
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'task-list',
        component: () => import('../views/TaskManagementView.vue'),
        meta: {
          title: 'task.route.management',
          requiresAuth: true,
        },
      },
      {
        path: 'dependency-validation-demo',
        name: 'task-dependency-demo',
        component: () => import('../views/DependencyValidationDemoView.vue'),
        meta: {
          title: 'task.route.dependencyDemo',
          requiresAuth: true,
          showInNav: import.meta.env.DEV, // 仅开发环境显示
        },
      },
      {
        path: ':id',
        name: 'task-detail',
        component: () => import('../views/TaskDetailView.vue'),
        meta: {
          title: 'task.route.detail',
          requiresAuth: true,
        },
        props: true,
      },
    ],
  },
];
