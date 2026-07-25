import type { AuthResponseDTO, RefreshSessionRequest } from '@dailyuse/contracts/authentication';

import type { AuthRemoteGateway } from './auth-remote-gateway';
import {
  createOfflineAuthError,
  createRemoteUnreachableError,
  createTerminalAuthError,
  type AuthFlowLogger,
  type DesktopAuthFlowResult,
} from './auth-flow-types';

// Residual 895: application online refresh AuthFlowResult (≠ protocol TokenRefreshResult / RefreshSessionResponse).
// Residual 917: DesktopRefreshResult dual retired — DesktopAuthFlowResult sole application name.

interface RefreshDesktopSessionDependencies {
  isOnline: () => boolean;
  remoteGateway: Pick<AuthRemoteGateway, 'createRefreshUrl' | 'refreshToken'>;
  logger: AuthFlowLogger;
  onSuccess?: (response: AuthResponseDTO, request: RefreshSessionRequest) => Promise<void>;
}

export async function refreshDesktopSession(
  request: RefreshSessionRequest,
  dependencies: RefreshDesktopSessionDependencies,
): Promise<DesktopAuthFlowResult> {
  const { isOnline, remoteGateway, logger, onSuccess } = dependencies;

  logger.info('Desktop refresh attempt', { sessionId: request.sessionId });

  if (!isOnline()) {
    return {
      ok: false,
      error: createOfflineAuthError('OFFLINE'),
    };
  }

  try {
    const refreshUrl = remoteGateway.createRefreshUrl();
    logger.info('Calling refresh API', { refreshUrl });

    const response = await remoteGateway.refreshToken(request);

    if (!response.ok) {
      const message =
        ('message' in response.data && response.data.message) ||
        ('error' in response.data && response.data.error) ||
        `刷新失败 (${response.status})`;
      logger.info('Remote refresh rejected', { status: response.status, message });

      return {
        ok: false,
        error: createTerminalAuthError('REFRESH_FAILED', message),
      };
    }

    if (
      !('identity' in response.data) ||
      !('session' in response.data) ||
      !response.data.accessToken
    ) {
      logger.error('Remote refresh returned incomplete auth payload', {
        status: response.status,
        data: response.data,
      });

      return {
        ok: false,
        error: createTerminalAuthError('REFRESH_FAILED', '刷新成功，但认证数据不完整'),
      };
    }

    if (onSuccess) {
      try {
        await onSuccess(response.data, request);
      } catch (error) {
        logger.error('Remote refresh succeeded but local persistence failed', {
          error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        });
        return {
          ok: false,
          error: createTerminalAuthError('REFRESH_FAILED', '本地持久化失败'),
        };
      }
    }

    return {
      ok: true,
      response: response.data,
    };
  } catch (error) {
    logger.warn('Remote refresh request failed, allowing local fallback', { error });
    return {
      ok: false,
      error: createRemoteUnreachableError(
        error instanceof Error ? error.message : 'REMOTE_REFRESH_UNAVAILABLE',
      ),
    };
  }
}
