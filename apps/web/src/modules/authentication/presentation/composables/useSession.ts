/**
 * useSession - 会话管理 Composable
 *
 * 通过 DI 注入的 AuthClientService 与后端交互。
 * Service 负责 API 调用，Composable 负责 Store 更新 + UI 状态。
 *
 * @module authentication/presentation/composables
 */

import { computed, inject } from 'vue';
import { toast } from 'vue-sonner';
import { useAuthenticationStore } from '../stores/authenticationStore';
import { AUTH_SERVICE_KEY, authService as fallbackService } from '@/shared/di';

export function useSession() {
  const store = useAuthenticationStore();
  const service = inject(AUTH_SERVICE_KEY, fallbackService);

  // ========== Computed State ==========
  const activeSessions = computed(() => store.activeSessions);
  const currentSession = computed(() => store.currentSession);
  const sessionCount = computed(() => store.getActiveSessionCount);

  // ========== 会话操作 ==========

  async function loadSessions(): Promise<boolean> {
    if (!store.accessToken) return false;

    store.setLoading(true);
    try {
      const result = await service.listSessions();
      if (result.ok) {
        store.setActiveSessions(result.data.sessions as any);
        return true;
      } else {
        const message = result.error.message || '加载会话列表失败';
        store.setError(message);
        toast.error('加载失败', { description: message });
        return false;
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function revokeSession(sessionId: string): Promise<boolean> {
    if (!store.accessToken) return false;

    store.setLoading(true);
    try {
      const result = await service.revokeSession({ sessionId });
      if (result.ok) {
        store.removeActiveSession(sessionId);
        toast.success('会话已撤销');
        return true;
      } else {
        const message = result.error.message || '撤销会话失败';
        store.setError(message);
        toast.error('操作失败', { description: message });
        return false;
      }
    } finally {
      store.setLoading(false);
    }
  }

  return {
    // State
    activeSessions,
    currentSession,
    sessionCount,

    // Actions
    loadSessions,
    revokeSession,
  };
}
