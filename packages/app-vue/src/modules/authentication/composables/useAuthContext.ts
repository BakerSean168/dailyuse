import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { AuthResponseDTO } from '@dailyuse/contracts/authentication';
import type { ResultError } from '@dailyuse/contracts/result';
import type { IAuthService } from '../../../di/types';
import { useAuthenticationStore } from '../stores/authentication-store';
import { AUTH_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { translateResultError } from '../../../shared/utils/translate-result-error';

export const isDesktopEnvironment = () =>
  typeof window !== 'undefined' && typeof (window as unknown as { electronAPI?: { invoke?: unknown } }).electronAPI?.invoke === 'function';

export interface AuthContext {
  store: ReturnType<typeof useAuthenticationStore>;
  service: IAuthService;
  t: ReturnType<typeof useI18n>['t'];
  lastResultError: ReturnType<typeof ref<ResultError | null>>;
  redirectWithReload: (path: string) => void;
  handleAuthSuccess: (data: AuthResponseDTO) => void;
  getLocalizedAuthError: (errorLike: unknown, fallbackKey: string) => string;
}

export function createAuthContext(): AuthContext {
  const store = useAuthenticationStore();
  const router = useRouter();
  const service = useStrictInject(AUTH_SERVICE_KEY, 'AuthService');
  const { t } = useI18n();
  const lastResultError = ref<ResultError | null>(null);

  function redirectWithReload(path: string) {
    if (typeof window !== 'undefined') {
      window.location.replace(path);
      return;
    }
    void router.push(path);
  }

  function handleAuthSuccess(data: AuthResponseDTO) {
    store.handleAuthResponse(data);
    store.setError(null);
  }

  function getLocalizedAuthError(errorLike: unknown, fallbackKey: string): string {
    return translateResultError(errorLike, t, {
      scope: 'auth',
      fallbackKey,
    });
  }

  return {
    store,
    service,
    t,
    lastResultError,
    redirectWithReload,
    handleAuthSuccess,
    getLocalizedAuthError,
  };
}
