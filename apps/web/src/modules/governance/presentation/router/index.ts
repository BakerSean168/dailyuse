/**
 * Governance module routes
 */

import type { RouteRecordRaw } from 'vue-router';

export const governanceRoutes: RouteRecordRaw[] = [
  {
    path: '/governance',
    name: 'governance',
    meta: {
      title: '治理规则',
      showInNav: true,
      icon: 'mdi-shield-check',
      order: 8,
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'governance-list',
        component: () => import('../views/GovernanceListView.vue'),
        meta: {
          title: '治理规则',
          requiresAuth: true,
        },
      },
      {
        path: ':id',
        name: 'governance-detail',
        component: () => import('../views/GovernanceDetailView.vue'),
        meta: {
          title: '治理规则详情',
          requiresAuth: true,
        },
        props: true,
      },
    ],
  },
];
