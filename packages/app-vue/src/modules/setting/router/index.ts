/**
 * Setting 模块路由配置
 */

import type { RouteRecordRaw } from 'vue-router';

export const settingRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/UserSettingsView.vue'),
    meta: {
      title: 'setting.title',
      showInNav: false, // 不在侧边栏显示，通过账户菜单访问
      requiresAuth: true,
      /** 独立设置场景（STATE D）；AppShell 按此切换外壳，不进 BusinessPanel。 */
      shellScene: 'settings',
    },
    // 新版本使用内部标签导航，不需要子路由
  },
];
