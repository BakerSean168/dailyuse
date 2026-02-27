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
        path: 'compare',
        name: 'goal-comparison',
        component: () => import('../views/MultiGoalComparisonView.vue'),
        meta: {
          title: 'goal.route.multiComparison',
          requiresAuth: true,
        },
      },
      {
        path: 'rules-demo',
        name: 'goal-rules-demo',
        component: () => import('../views/StatusRulesDemoView.vue'),
        meta: {
          title: 'goal.route.rulesTester',
          requiresAuth: true,
        },
      },
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
