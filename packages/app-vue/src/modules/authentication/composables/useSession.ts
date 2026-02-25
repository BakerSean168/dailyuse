/**
 * useSession - 会话管理 Composable
 *
 * 通过 DI 注入的 AuthClientService 与后端交互。
 * Service 返回 Result<T>，Composable 负责 Result 解包 + Store 更新 + UI 状态。
 *
 * @module authentication/composables
 */

import { computed } from 'vue';
import { toast } from 'vue-sonner';
import { useAuthenticationStore } from '../stores/authenticationStore';
import { AUTH_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';

export function useSession() {
  const store = useAuthenticationStore();
  const service = useStrictInject(AUTH_SERVICE_KEY, 'AuthService');

  // ========== Computed State ==========
  const activeSessions = computed(() => store.activeSessions);
  const currentSession = computed(() => store.currentSession);
  const sessionCount = computed(() => store.getActiveSessionCount);

  // ========== 会话操作 ==========

  async function loadSessions(): Promise<boolean> {
    if (!store.accessToken) return false;

    store.setLoading(true);
    const result = await service.listSessions();
    store.setLoading(false);

    if (result.ok) {
      store.setActiveSessions(result.data.sessions as any);
      return true;
    }
    const message = result.error.message || '加载会话列表失败';
    store.setError(message);
    toast.error('加载失败', { description: message });
    return false;
  }

  async function revokeSession(sessionId: string): Promise<boolean> {
    if (!store.accessToken) return false;

    store.setLoading(true);
    const result = await service.revokeSession({ sessionId } as Parameters<
      typeof service.revokeSession
    >[0]);
    store.setLoading(false);

    if (result.ok) {
      store.removeActiveSession(sessionId);
      toast.success('会话已撤销');
      return true;
    }
    const message = result.error.message || '撤销会话失败';
    store.setError(message);
    toast.error('操作失败', { description: message });
    return false;
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
