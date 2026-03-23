/**
 * Repository 模块路由配置
 * Obsidian 风格仓库工作区
 */

import type { RouteRecordRaw } from 'vue-router';

export const repositoryRoutes: RouteRecordRaw[] = [
  {
    path: '/repository',
    name: 'repository',
    component: () => import('../views/RepositoryWorkspaceView.vue'),
    meta: {
      title: '仓库',
      showInNav: true,
      icon: 'lucide:book-open',
      order: 7,
      requiresAuth: true,
    },
  },
  {
    path: '/note/:id',
    name: 'note-edit',
    component: () => import('../../editor/views/EditorLinearView.vue'),
    meta: {
      title: '编辑笔记',
      requiresAuth: true,
      hideSidebar: true,
    },
  },
];
