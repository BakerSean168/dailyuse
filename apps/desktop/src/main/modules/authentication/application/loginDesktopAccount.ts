import { type AuthResponseDTO } from '@dailyuse/contracts/authentication';

import type { AuthRemoteGateway } from './AuthRemoteGateway';
import {
  createOfflineAuthError,
  createRemoteUnreachableError,
  createTerminalAuthError,
  type AuthFlowLogger,
  type AuthFlowResult,
} from './authFlowTypes';

export interface DesktopLoginRequest {
  email: string;
  password: string;
  rememberPassword?: boolean;
  autoLogin?: boolean;
}

export type DesktopLoginResult = AuthFlowResult<AuthResponseDTO>;

interface LoginDesktopAccountDependencies {
  isOnline: () => boolean;
  remoteGateway: Pick<AuthRemoteGateway, 'createLoginUrl' | 'login'>;
  logger: AuthFlowLogger;
  onSuccess?: (response: AuthResponseDTO, request: DesktopLoginRequest) => Promise<void>;
}

export async function loginDesktopAccount(
  request: DesktopLoginRequest,
  dependencies: LoginDesktopAccountDependencies,
): Promise<DesktopLoginResult> {
  const { isOnline, remoteGateway, logger, onSuccess } = dependencies;

  logger.info('Desktop login attempt', { email: request.email });

  if (!isOnline()) {
    return {
      ok: false,
      error: createOfflineAuthError('OFFLINE'),
    };
  }

  try {
    const loginUrl = remoteGateway.createLoginUrl();
    logger.info('Calling login API', { loginUrl });

    const response = await remoteGateway.login({
      email: request.email,
      password: request.password,
    });

    if (!response.ok) {
      const message =
        ('message' in response.data && response.data.message) ||
        ('error' in response.data && response.data.error) ||
        `登录失败 (${response.status})`;
      logger.info('Remote login rejected', { status: response.status, message });

      return {
        ok: false,
        error: createTerminalAuthError('AUTH_FAILED', message),
      };
    }

    if (
      !('identity' in response.data) ||
      !('session' in response.data) ||
      !response.data.accessToken
    ) {
      logger.error('Remote login returned incomplete auth payload', {
        status: response.status,
        data: response.data,
      });

      return {
        ok: false,
        error: createTerminalAuthError('AUTH_FAILED', '登录成功，但认证数据不完整'),
      };
    }

    logger.info('Remote login successful', {
      identityId: response.data.identity.id,
      sessionId: response.data.session.id,
    });

    if (onSuccess) {
      await onSuccess(response.data, request);
    }

    return {
      ok: true,
      response: response.data,
    };
  } catch (error) {
    logger.warn('Remote login request failed, allowing offline fallback', { error });
    return {
      ok: false,
      error: createRemoteUnreachableError(
        error instanceof Error ? error.message : 'REMOTE_LOGIN_UNAVAILABLE',
      ),
    };
  }
}
