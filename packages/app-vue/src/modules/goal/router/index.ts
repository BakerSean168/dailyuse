/**
 * Goal 模块路由配置
 */

import type { RouteRecordRaw } from 'vue-router';

export const goalRoutes: RouteRecordRaw[] = [
  {
    path: '/goals',
    name: 'goals',
    meta: {
      title: '目标管理',
      showInNav: true,
      icon: 'mdi-target',
      order: 3,
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'goal-list',
        component: () => import('../views/GoalListView.vue'),
        meta: {
          title: '目标列表',
          requiresAuth: true,
        },
      },
      {
        path: 'compare',
        name: 'goal-comparison',
        component: () => import('../views/MultiGoalComparisonView.vue'),
        meta: {
          title: '多目标对比',
          requiresAuth: true,
        },
      },
      {
        path: 'rules-demo',
        name: 'goal-rules-demo',
        component: () => import('../views/StatusRulesDemoView.vue'),
        meta: {
          title: '规则测试器',
          requiresAuth: true,
        },
      },
      {
        path: ':id',
        name: 'goal-detail',
        component: () => import('../views/GoalDetailView.vue'),
        meta: {
          title: '目标详情',
          requiresAuth: true,
        },
        props: true,
      },
      {
        path: ':goalId/review/create',
        name: 'goal-review-create',
        component: () => import('../views/GoalReviewCreationView.vue'),
        meta: {
          title: '创建目标复盘',
          requiresAuth: true,
        },
        props: true,
      },
      {
        path: ':goalId/review/:reviewId',
        name: 'goal-review-detail',
        component: () => import('../views/GoalReviewDetailView.vue'),
        meta: {
          title: '目标复盘记录',
          requiresAuth: true,
        },
        props: true,
      },
      {
        path: ':goalId/key-results/:keyResultId',
        name: 'key-result-detail',
        component: () => import('../views/KeyResultDetailView.vue'),
        meta: {
          title: '关键结果详情',
          requiresAuth: true,
        },
        props: true,
      },
    ],
  },
];
