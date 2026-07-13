/**
 * Repository / Note 模块路由配置（UI 重构 V2 §3 / §6 Note）
 *
 * 路径契约不变：`/repository`、`/note/:id`。
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
        component: () => import('../views/RepositoryWorkspaceView.vue'),
        meta: {
          title: 'repository.route.workspace',
          requiresAuth: true,
        },
      },
    ],
  },
  {
    path: '/note/:id',
    component: NoteModuleLayout,
    meta: {
      title: 'repository.route.noteEdit',
      requiresAuth: true,
      hideSidebar: true,
    },
    children: [
      {
        path: '',
        name: 'note-edit',
        component: () => import('../../editor/views/EditorLinearView.vue'),
        meta: {
          title: 'repository.route.noteEdit',
          requiresAuth: true,
          hideSidebar: true,
        },
      },
    ],
  },
];
