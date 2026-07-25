import type {
  AuthResponseDTO,
  ForgotPasswordReq,
  GetOAuthUrlReq,
  OAuthCallbackReq,
  LoginByEmailReq,
  RegisterByEmailReq,
  ResetPasswordReq,
  SendEmailCodeReq,
  VerifyEmailCodeReq,
} from '@dailyuse/contracts/authentication';
import type { ResultError } from '@dailyuse/contracts/result';
import { classifyNetworkErrorMessage } from '@dailyuse/http-client';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { translateAuthResultError } from './result-error';
import { useAuthService } from './service';

const AUTH_STORAGE_KEY = 'authentication';
const ACCESS_TOKEN_STORAGE_KEY = 'access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

export type AuthSuccessOutcome = 'authenticated' | 'needs-email-verification';

function isUnverifiedIdentity(identity: AuthResponseDTO['identity'] | undefined): boolean {
  return identity?.status === 'Unverified';
}

export function useWebAuth() {
  const service = useAuthService();
  const { t } = useI18n();

  const isLoading = ref(false);
  const error = ref<ResultError | null>(null);
  const successMessage = ref<string | null>(null);
  const pendingVerificationEmail = ref<string | null>(null);
  const errorMessage = computed(() =>
    error.value
      ? translateAuthResultError(error.value, t, {
          scope: 'auth',
          fallbackKey: 'auth.errors.UNKNOWN',
        })
      : null,
  );

  /**
   * Residual 1201 keep-boundary: web auth handleAuthSuccess — localStorage token persistence.
   * Writes access/refresh/auth-state into window.localStorage (no Pinia/store path).
   * Soft residual 1201: app-vue useAuthContext handleAuthSuccess is store-only (no force-merge).
   */
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

  function readAccessToken(): string | undefined {
    try {
      const raw = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
      return raw || undefined;
    } catch {
      return undefined;
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

  function clearError() {
    error.value = null;
  }

  function clearSuccessMessage() {
    successMessage.value = null;
  }

  async function loginByEmail(req: LoginByEmailReq): Promise<AuthSuccessOutcome | false> {
    isLoading.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const result = await service.loginByEmail(req);
      if (result.ok) {
        handleAuthSuccess(result.data);
        if (isUnverifiedIdentity(result.data.identity)) {
          pendingVerificationEmail.value = req.email.trim();
          return 'needs-email-verification';
        }
        redirectToApp();
        return 'authenticated';
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

  async function registerByEmail(req: RegisterByEmailReq): Promise<AuthSuccessOutcome | false> {
    isLoading.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const result = await service.registerByEmail(req);
      if (result.ok) {
        handleAuthSuccess(result.data);
        if (isUnverifiedIdentity(result.data.identity)) {
          pendingVerificationEmail.value = req.email.trim();
          return 'needs-email-verification';
        }
        redirectToApp();
        return 'authenticated';
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

  async function forgotPassword(req: ForgotPasswordReq): Promise<boolean> {
    isLoading.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const result = await service.forgotPassword(req);
      if (result.ok) {
        successMessage.value = t('auth.forgot.sent');
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

  async function resetPassword(req: ResetPasswordReq): Promise<boolean> {
    isLoading.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const result = await service.resetPassword(req);
      if (result.ok) {
        successMessage.value = t('auth.reset.success');
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

  async function sendEmailCode(req: SendEmailCodeReq): Promise<boolean> {
    isLoading.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const result = await service.sendEmailCode({
        ...req,
        purpose: req.purpose ?? 'EmailVerify',
      });
      if (result.ok) {
        successMessage.value = t('auth.verify.sent');
        if (req.email) {
          pendingVerificationEmail.value = req.email.trim();
        }
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

  async function verifyEmailCode(req: VerifyEmailCodeReq): Promise<boolean> {
    isLoading.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const result = await service.verifyEmailCode({
        ...req,
        purpose: req.purpose ?? 'EmailVerify',
      });
      if (result.ok) {
        if (result.data?.identity) {
          try {
            const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw) as {
                accessToken?: string;
                refreshToken?: string | null;
                currentIdentity?: unknown;
                authMode?: string | null;
              };
              window.localStorage.setItem(
                AUTH_STORAGE_KEY,
                JSON.stringify({
                  ...parsed,
                  currentIdentity: result.data.identity,
                }),
              );
            }
          } catch {
            // Ignore local state repair failures; verification already succeeded.
          }
        }
        pendingVerificationEmail.value = null;
        successMessage.value = t('auth.verify.success');
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


  async function startGithubLogin(redirectUri?: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const req: GetOAuthUrlReq = { provider: 'Github', redirectUri };
      const result = await service.getOAuthUrl(req);
      if (!result.ok) {
        error.value = result.error;
        return false;
      }
      window.location.assign(result.data.authUrl);
      return true;
    } catch (errorLike) {
      error.value = normalizeAuthError(errorLike);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Probe whether GitHub OAuth is configured without issuing state/PKCE.
   * 探测 GitHub OAuth 是否已配置，且不签发 state/PKCE。
   */
  async function probeGithubAvailability(): Promise<boolean> {
    try {
      if (!service.listOAuthProviders) return false;
      const result = await service.listOAuthProviders();
      if (!result.ok) return false;
      return result.data.providers.some((p) => p.provider === 'Github' && p.enabled);
    } catch {
      return false;
    }
  }

  async function completeGithubOAuth(code: string, state: string): Promise<AuthSuccessOutcome | null> {
    isLoading.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const req: OAuthCallbackReq = { provider: 'Github', code, state };
      const result = await service.oauthCallback(req);
      if (!result.ok) {
        error.value = result.error;
        return null;
      }
      handleAuthSuccess(result.data);
      if (isUnverifiedIdentity(result.data.identity)) {
        pendingVerificationEmail.value = null;
        return 'needs-email-verification';
      }
      redirectToApp();
      return 'authenticated';
    } catch (errorLike) {
      error.value = normalizeAuthError(errorLike);
      return null;
    } finally {
      isLoading.value = false;
    }
  }


  return {
    error,
    errorMessage,
    successMessage,
    pendingVerificationEmail,
    startGithubLogin,
    probeGithubAvailability,
    completeGithubOAuth,
    isLoading,
    clearError,
    clearSuccessMessage,
    loginByEmail,
    registerByEmail,
    forgotPassword,
    resetPassword,
    sendEmailCode,
    verifyEmailCode,
    readAccessToken,
  };
}
