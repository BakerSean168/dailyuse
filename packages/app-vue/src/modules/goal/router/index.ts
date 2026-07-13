/**
 * Goal 模块路由配置
 */

import type { RouteRecordRaw } from 'vue-router';

export const goalRoutes: RouteRecordRaw[] = [
  {
    path: '/goals',
    name: 'goals',
    meta: {
      title: 'goal.route.management',
      showInNav: true,
      icon: 'mdi-target',
      order: 3,
      requiresAuth: true,
    },
    component: () => import('../views/GoalModuleLayout.vue'),
    children: [
      {
        path: '',
        name: 'goal-list',
        component: () => import('../views/GoalListView.vue'),
        meta: {
          title: 'goal.route.list',
          requiresAuth: true,
        },
      },
      {
        path: 'focus',
        name: 'goal-focus',
        component: () => import('../views/GoalFocusView.vue'),
        meta: {
          title: 'goal.route.focusMode',
          requiresAuth: true,
        },
      },
      {
        path: 'compare',
        name: 'goal-comparison',
        component: () => import('../views/MultiGoalComparisonView.vue'),
        meta: {
          title: 'goal.route.multiComparison',
          requiresAuth: true,
        },
      },
      // 状态规则演示页：仅开发构建注册，不进生产路由（Brief §8-P3）
      ...(import.meta.env.DEV
        ? [
            {
              path: 'rules-demo',
              name: 'goal-rules-demo',
              component: () => import('../views/StatusRulesDemoView.vue'),
              meta: {
                title: 'goal.route.rulesTester',
                requiresAuth: true,
              },
            } satisfies RouteRecordRaw,
          ]
        : []),
      {
        path: ':id',
        name: 'goal-detail',
        component: () => import('../views/GoalDetailView.vue'),
        meta: {
          title: 'goal.route.detail',
          requiresAuth: true,
        },
        props: true,
      },
      {
        path: ':goalId/review/create',
        name: 'goal-review-create',
        component: () => import('../views/GoalReviewCreationView.vue'),
        meta: {
          title: 'goal.route.createReview',
          requiresAuth: true,
        },
        props: true,
      },
      {
        path: ':goalId/review/:reviewId',
        name: 'goal-review-detail',
        component: () => import('../views/GoalReviewDetailView.vue'),
        meta: {
          title: 'goal.route.reviewDetail',
          requiresAuth: true,
        },
        props: true,
      },
      {
        path: ':goalId/key-results/:keyResultId',
        name: 'key-result-detail',
        component: () => import('../views/KeyResultDetailView.vue'),
        meta: {
          title: 'goal.route.krDetail',
          requiresAuth: true,
        },
        props: true,
      },
    ],
  },
];
