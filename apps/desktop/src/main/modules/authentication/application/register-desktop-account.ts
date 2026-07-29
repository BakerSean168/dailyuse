import type { EmailRegisterCredentials } from '@memoflow/contracts/authentication';

import type { AuthRemoteGateway, RegisterApiResponse } from './auth-remote-gateway';
import {
  createConfigError,
  createOfflineAuthError,
  createRemoteUnreachableError,
  createTerminalAuthError,
  type AuthFlowLogger,
  type DesktopAuthFlowResult,
} from './auth-flow-types';

// Residual 871: RegisterRequest dual retired — sole body elevated to contracts.
// Residual 931: RegisterRequest name fully retired — EmailRegisterCredentials sole body.
// Residual 917: RegisterResult dual retired — DesktopAuthFlowResult sole application name.

interface RegisterDesktopAccountDependencies {
  isOnline: () => boolean;
  remoteGateway: Pick<AuthRemoteGateway, 'createRegisterUrl' | 'register'>;
  logger: AuthFlowLogger;
  onSuccess?: (response: RegisterApiResponse, request: EmailRegisterCredentials) => Promise<void>;
}

export async function registerDesktopAccount(
  request: EmailRegisterCredentials,
  dependencies: RegisterDesktopAccountDependencies,
): Promise<DesktopAuthFlowResult> {
  const { isOnline, remoteGateway, logger, onSuccess } = dependencies;

  logger.info('Register attempt', { email: request.email });

  if (!isOnline()) {
    return {
      ok: false,
      error: createOfflineAuthError(
        '注册需要网络连接，请检查网络后重试。离线状态下可使用访客模式或已有账户登录。',
      ),
    };
  }

  try {
    let registerUrl: string;
    try {
      registerUrl = remoteGateway.createRegisterUrl();
    } catch (error) {
      logger.error('Failed to resolve register API URL from desktop config', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      });
      return {
        ok: false,
        error: createConfigError(
          error instanceof Error ? error.message : 'Desktop API base URL is not configured',
        ),
      };
    }

    logger.info('Calling register API', { registerUrl });

    const response = await remoteGateway.register({
      email: request.email,
      password: request.password,
      username: request.username,
    }, registerUrl);

    const { data } = response;

    if (!response.ok) {
      logger.error('Registration failed', { status: response.status, data });

      const message = data.message || data.error || `注册失败 (${response.status})`;
      const code =
        response.status === 409
          ? 'CONFLICT'
          : response.status >= 400 && response.status < 500
            ? 'VALIDATION_ERROR'
            : 'REGISTER_FAILED';

      return {
        ok: false,
        error: createTerminalAuthError(code, message),
      };
    }

    logger.info('Registration successful', { email: request.email });

    if (!data.accessToken || !data.identity || !data.session) {
      logger.error('Registration succeeded but auth payload is incomplete', { data });

      return {
        ok: false,
        error: createTerminalAuthError('REGISTER_FAILED', '注册成功，但认证数据不完整'),
      };
    }

    if (onSuccess) {
      try {
        await onSuccess(data, request);
      } catch (error) {
        logger.error('Remote registration succeeded but local persistence failed', {
          error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        });
        return {
          ok: false,
          error: createTerminalAuthError('REGISTER_ERROR', '本地持久化失败'),
        };
      }
    }

    return {
      ok: true,
      response: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        identity: data.identity,
        session: data.session,
      },
    };
  } catch (error) {
    logger.error('Registration request failed', {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });

    if (error instanceof TypeError) {
      return {
        ok: false,
        error: createRemoteUnreachableError('无法连接到认证服务，请确认接口已启动后重试'),
      };
    }

    return {
      ok: false,
      error: createTerminalAuthError(
        'REGISTER_ERROR',
        error instanceof Error ? error.message : '注册失败，请稍后重试',
      ),
    };
  }
}
