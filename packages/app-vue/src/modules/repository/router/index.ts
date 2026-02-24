/**
 * Repository 模块路由配置
 * Epic 10 Story 11.x - Obsidian 风格知识仓库界面
 */

import type { RouteRecordRaw } from 'vue-router';

export const repositoryRoutes: RouteRecordRaw[] = [
  {
    path: '/repositories',
    name: 'repositories',
    component: () => import('../views/RepositoryLinearView.vue'),
    meta: {
      title: '知识仓库',
      showInNav: true,
      icon: 'lucide:book-open',
      order: 7,
      requiresAuth: true,
    },
  },
  {
    path: '/document/:id',
    name: 'document-edit',
    // Editor view will be provided when the editor module is migrated
    component: () => import('../../editor/views/EditorLinearView.vue'),
    meta: {
      title: '编辑文档',
      requiresAuth: true,
      hideSidebar: true,
    },
  },
];
