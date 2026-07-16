import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AuthResponseDTO, LoginByEmailReq, RegisterByEmailReq } from '@dailyuse/contracts/authentication';
import type { ResultError } from '@dailyuse/contracts/result';
import { classifyNetworkErrorMessage } from '@dailyuse/http-client';

import { translateAuthResultError } from './result-error';
import { useAuthService } from './service';

const AUTH_STORAGE_KEY = 'authentication';
const ACCESS_TOKEN_STORAGE_KEY = 'access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

export function useWebAuth() {
  const service = useAuthService();
  const { t } = useI18n();

  const isLoading = ref(false);
  const error = ref<ResultError | null>(null);
  const errorMessage = computed(() =>
    error.value
      ? translateAuthResultError(error.value, t, {
          scope: 'auth',
          fallbackKey: 'auth.errors.UNKNOWN',
        })
      : null,
  );

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

  function normalizeAuthError(errorLike: unknown): ResultError {
    if (
      errorLike &&
      typeof errorLike === 'object' &&
      'code' in errorLike &&
      typeof errorLike.code === 'string' &&
      'message' in errorLike &&
      typeof errorLike.message === 'string'
    ) {
      return errorLike as ResultError;
    }

    if (errorLike instanceof Error) {
      return classifyNetworkErrorMessage(errorLike.message);
    }

    return { code: 'UNKNOWN', message: 'Authentication failed' };
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

      error.value = normalizeAuthError(result.error);
      return false;
    } catch (errorLike) {
      error.value = normalizeAuthError(errorLike);
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

      error.value = normalizeAuthError(result.error);
      return false;
    } catch (errorLike) {
      error.value = normalizeAuthError(errorLike);
      return false;
    } finally {
      isLoading.value = false;
    }
  }


  function clearError() {
    error.value = null;
  }

  return {
    error,
    errorMessage,
    isLoading,
    clearError,
    loginByEmail,
    registerByEmail,
  };
}
