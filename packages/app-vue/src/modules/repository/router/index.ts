/**
 * Repository 模块路由配置
 * Obsidian 风格笔记工作区
 */

import type { RouteRecordRaw } from 'vue-router';

export const repositoryRoutes: RouteRecordRaw[] = [
  {
    path: '/repository',
    name: 'repository',
    component: () => import('../views/RepositoryWorkspaceView.vue'),
    meta: {
      title: 'repository.route.workspace',
      showInNav: true,
      icon: 'lucide:notebook-text',
      order: 7,
      requiresAuth: true,
    },
  },
  {
    path: '/note/:id',
    name: 'note-edit',
    component: () => import('../../editor/views/EditorLinearView.vue'),
    meta: {
      title: 'repository.route.noteEdit',
      requiresAuth: true,
      hideSidebar: true,
    },
  },
];
