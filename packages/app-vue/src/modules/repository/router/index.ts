/**
 * Repository / Note 模块路由配置（UI 重构 V2 §3 / §6 Note）
 *
 * `/repository` is the only note workspace entry. Existing-note editing is
 * intentionally absent; Desktop delegates edits to Obsidian and Web remains
 * projection-only.
 * 与 governance 共用 NoteModuleLayout 顶部分区 [笔记 | 规范]。
 */

import type { RouteRecordRaw } from 'vue-router';

const NoteModuleLayout = () => import('../views/NoteModuleLayout.vue');

export const repositoryRoutes: RouteRecordRaw[] = [
  {
    path: '/repository',
    component: NoteModuleLayout,
    meta: {
      title: 'repository.route.workspace',
      showInNav: true,
      icon: 'lucide:notebook-text',
      order: 7,
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'repository',
        component: () => import('../views/RepositoryEntryView.vue'),
        meta: {
          title: 'repository.route.workspace',
          requiresAuth: true,
        },
      },
    ],
  },
];
