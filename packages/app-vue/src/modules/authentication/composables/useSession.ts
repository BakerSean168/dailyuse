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
import { useI18n } from 'vue-i18n';
import { useAuthenticationStore } from '../stores/authenticationStore';
import { AUTH_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { translateResultError } from '../../../shared/utils/translateResultError';

export function useSession() {
  const store = useAuthenticationStore();
  const service = useStrictInject(AUTH_SERVICE_KEY, 'AuthService');
  const { t } = useI18n();

  // ========== Computed State ==========
  const activeSessions = computed(() => store.activeSessions);
  const currentSession = computed(() => store.currentSession);
  const sessionCount = computed(() => store.getActiveSessionCount);

  function getSessionErrorMessage(error: unknown, fallbackKey: string) {
    return translateResultError(error, t, {
      scope: 'auth',
      fallbackKey,
    });
  }

  // ========== 会话操作 ==========

  async function loadSessions(): Promise<boolean> {
    if (!store.isAuthenticated) return false;

    store.setLoading(true);
    const result = await service.listSessions();
    store.setLoading(false);

    if (result.ok) {
      store.setActiveSessions(result.data.sessions);
      return true;
    }
    const message = getSessionErrorMessage(result.error, 'auth.toast.loadSessionsFailed');
    store.setError(message);
    toast.error(t('auth.toast.loadFailed'), { description: message });
    return false;
  }

  async function revokeSession(sessionId: string): Promise<boolean> {
    if (!store.isAuthenticated) return false;

    store.setLoading(true);
    const result = await service.revokeSession({ sessionId } as Parameters<
      typeof service.revokeSession
    >[0]);
    store.setLoading(false);

    if (result.ok) {
      store.removeActiveSession(sessionId);
      toast.success(t('auth.toast.sessionRevoked'));
      return true;
    }
    const message = getSessionErrorMessage(result.error, 'auth.toast.revokeSessionFailed');
    store.setError(message);
    toast.error(t('auth.toast.operationFailed'), { description: message });
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
