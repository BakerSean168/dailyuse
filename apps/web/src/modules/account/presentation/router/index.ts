/**
 * @file index.ts
 * @description 账户模块路由配置。定义了账户相关的页面路由，如个人资料、设置、安全中心等。
 * @author Jules (AI)
 */

import type { RouteRecordRaw } from 'vue-router';

/**
 * 账户模块路由表
 */
export const accountRoutes: RouteRecordRaw[] = [
  {
    path: '/account',
    name: 'account',
    meta: {
      title: '账户',
      showInNav: false, // 不在侧边栏显示，通过头像菜单访问
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        redirect: '/account/center',
      },
      {
        path: 'center',
        name: 'account-center',
        component: () => import('../views/AccountCenterView.vue'),
        meta: {
          title: '个人中心',
          requiresAuth: true,
        },
      },
      {
        path: 'profile',
        name: 'account-profile',
        component: () => import('../views/ProfileView.vue'),
        meta: {
          title: '个人资料',
          requiresAuth: true,
        },
      },
      {
        path: 'settings',
        name: 'account-settings',
        component: () => import('../views/SettingsView.vue'),
        meta: {
          title: '账户设置',
          requiresAuth: true,
        },
      },
      {
        path: 'security',
        name: 'account-security',
        component: () => import('../views/SecurityView.vue'),
        meta: {
          title: '安全设置',
          requiresAuth: true,
          permissions: ['account:security'],
        },
      },
    ],
  },
];
