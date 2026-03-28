import type { RouteRecordRaw } from 'vue-router';

export const aiRoutes: RouteRecordRaw[] = [
  {
    path: '/ai/chat',
    name: 'ai-chat',
    component: () => import('../views/AIChatView.vue'),
    meta: {
      title: 'aiAssistant.dialogs.chat.title',
      showInNav: true,
      requiresAuth: true,
    },
  },
];
