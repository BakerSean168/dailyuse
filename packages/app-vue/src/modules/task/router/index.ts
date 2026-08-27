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
        path: 'occurrences/:id',
        name: 'task-occurrence-detail',
        component: () => import('../views/TaskDetailView.vue'),
        meta: { title: 'task.route.detail', requiresAuth: true },
        props: true,
      },
      {
        path: 'plans',
        name: 'task-plans',
        component: () => import('../views/TaskPlanListView.vue'),
        meta: { title: 'task.route.plans', requiresAuth: true },
      },
      {
        path: 'plans/:id',
        name: 'task-plan-detail',
        component: () => import('../views/TaskPlanDetailView.vue'),
        meta: { title: 'task.route.planDetail', requiresAuth: true },
        props: true,
      },
      {
        path: ':id',
        name: 'task-detail',
        component: () => import('../views/TaskPlanDetailView.vue'),
        meta: {
          title: 'task.route.planDetail',
          requiresAuth: true,
        },
        props: true,
      },
    ],
  },
];
