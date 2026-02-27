/**
 * Governance module routes
 */

import type { RouteRecordRaw } from 'vue-router';

export const governanceRoutes: RouteRecordRaw[] = [
  {
    path: '/governance',
    name: 'governance',
    meta: {
      title: 'governance.route.ruleList',
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
          title: 'governance.route.ruleList',
          requiresAuth: true,
        },
      },
      {
        path: 'new',
        name: 'governance-editor',
        component: () => import('../views/RuleEditorView.vue'),
        meta: {
          title: 'governance.route.newRule',
          requiresAuth: true,
        },
      },
      {
        path: ':id/edit',
        name: 'governance-editor-edit',
        component: () => import('../views/RuleEditorView.vue'),
        meta: {
          title: 'governance.route.editRule',
          requiresAuth: true,
        },
        props: true,
      },
      {
        path: ':id',
        name: 'governance-detail',
        component: () => import('../views/GovernanceDetailView.vue'),
        meta: {
          title: 'governance.route.ruleDetail',
          requiresAuth: true,
        },
        props: true,
      },
      {
        path: ':id/history',
        name: 'governance-history',
        component: () => import('../views/RevisionHistoryView.vue'),
        meta: {
          title: 'governance.route.revisionHistory',
          requiresAuth: true,
        },
        props: true,
      },
    ],
  },
];
