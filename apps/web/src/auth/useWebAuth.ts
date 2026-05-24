import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AuthResponseDTO, LoginByEmailReq, RegisterByEmailReq } from '@dailyuse/contracts/authentication';

import { translateAuthResultError } from './result-error';
import { useAuthService } from './service';

const AUTH_STORAGE_KEY = 'authentication';
const ACCESS_TOKEN_STORAGE_KEY = 'access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

export function useWebAuth() {
  const service = useAuthService();
  const { t } = useI18n();

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  function handleAuthSuccess(data: AuthResponseDTO) {
    error.value = null;

    const authState = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      currentIdentity: data.identity,
      authMode: (data as AuthResponseDTO & { authMode?: string }).authMode ?? null,
    };

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, data.accessToken);

    if (data.refreshToken) {
      window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
    } else {
      window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  }

  function getLocalizedAuthError(errorLike: unknown, fallbackKey: string): string {
    return translateAuthResultError(errorLike, t, {
      scope: 'auth',
      fallbackKey,
    });
  }

  function redirectToApp() {
    window.location.replace('/');
  }

  async function loginByEmail(req: LoginByEmailReq): Promise<boolean> {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await service.loginByEmail(req);
      if (result.ok) {
        handleAuthSuccess(result.data);
        redirectToApp();
        return true;
      }

      const message = getLocalizedAuthError(result.error, 'auth.errors.UNKNOWN');
      error.value = message;
      return false;
    } catch (errorLike) {
      const description = getLocalizedAuthError(errorLike, 'auth.errors.UNKNOWN');
      error.value = description;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function registerByEmail(req: RegisterByEmailReq): Promise<boolean> {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await service.registerByEmail(req);
      if (result.ok) {
        handleAuthSuccess(result.data);
        redirectToApp();
        return true;
      }

      const message = getLocalizedAuthError(result.error, 'auth.errors.UNKNOWN');
      error.value = message;
      return false;
    } catch (errorLike) {
      const description = getLocalizedAuthError(errorLike, 'auth.errors.UNKNOWN');
      error.value = description;
      return false;
    } finally {
      isLoading.value = false;
    }
  }


  return {
    error,
    isLoading,
    loginByEmail,
    registerByEmail,
  };
}
