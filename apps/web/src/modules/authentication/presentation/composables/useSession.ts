/**
 * useSession - 会话管理 Composable
 *
 * 处理会话列表、撤销会话等操作。
 * 通过 authApi 服务直接调用 API，使用 store 管理状态。
 *
 * @module authentication/presentation/composables
 */

import { computed } from 'vue';
import { toast } from 'vue-sonner';
import { useAuthenticationStore } from '../stores/authenticationStore';
import { authApi, AuthApiError } from '../services/authApi';

export function useSession() {
  const store = useAuthenticationStore();

  // ========== Computed State ==========
  const activeSessions = computed(() => store.activeSessions);
  const currentSession = computed(() => store.currentSession);
  const sessionCount = computed(() => store.getActiveSessionCount);

  // ========== 会话操作 ==========

  async function loadSessions(): Promise<boolean> {
    if (!store.accessToken) return false;

    store.setLoading(true);
    try {
      const data = await authApi.listSessions(store.accessToken);
      store.setActiveSessions(data.sessions as any);
      return true;
    } catch (err) {
      const message = err instanceof AuthApiError ? err.message : '加载会话列表失败';
      store.setError(message);
      toast.error('加载失败', { description: message });
      return false;
    } finally {
      store.setLoading(false);
    }
  }

  async function revokeSession(sessionId: string): Promise<boolean> {
    if (!store.accessToken) return false;

    store.setLoading(true);
    try {
      await authApi.revokeSession({ sessionId }, store.accessToken);
      store.removeActiveSession(sessionId);
      toast.success('会话已撤销');
      return true;
    } catch (err) {
      const message = err instanceof AuthApiError ? err.message : '撤销会话失败';
      store.setError(message);
      toast.error('操作失败', { description: message });
      return false;
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
