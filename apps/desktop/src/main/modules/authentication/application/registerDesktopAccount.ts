import type { AuthRemoteGateway, RegisterApiResponse } from './AuthRemoteGateway';
import {
  createOfflineAuthError,
  createRemoteUnreachableError,
  createTerminalAuthError,
  type AuthFlowLogger,
  type AuthFlowResult,
} from './authFlowTypes';

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

export interface RegisterSuccessData {
  identityId: string;
  message: string;
}

export type RegisterResult = AuthFlowResult<RegisterSuccessData>;

interface RegisterDesktopAccountDependencies {
  isOnline: () => boolean;
  remoteGateway: Pick<AuthRemoteGateway, 'createRegisterUrl' | 'register'>;
  logger: AuthFlowLogger;
  onSuccess?: (response: RegisterApiResponse, request: RegisterRequest) => Promise<void>;
}

export async function registerDesktopAccount(
  request: RegisterRequest,
  dependencies: RegisterDesktopAccountDependencies,
): Promise<RegisterResult> {
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
    const registerUrl = remoteGateway.createRegisterUrl();

    logger.info('Calling register API', { registerUrl });

    const response = await remoteGateway.register({
      email: request.email,
      password: request.password,
      username: request.username,
    });

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

    if (onSuccess) {
      await onSuccess(data, request);
    }

    return {
      ok: true,
      response: {
        identityId: data.identityId || data.user?.id || '',
        message: '注册成功',
      },
    };
  } catch (error) {
    logger.error('Registration request failed', { error });

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
