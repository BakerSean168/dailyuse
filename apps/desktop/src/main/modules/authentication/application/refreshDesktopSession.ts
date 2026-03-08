import type {
  RefreshSessionRequest,
  RefreshSessionResponse,
} from '@dailyuse/contracts/authentication';

import type { AuthRemoteGateway } from './AuthRemoteGateway';
import {
  createOfflineAuthError,
  createRemoteUnreachableError,
  createTerminalAuthError,
  type AuthFlowLogger,
  type AuthFlowResult,
} from './authFlowTypes';

export type DesktopRefreshResult = AuthFlowResult<RefreshSessionResponse>;

interface RefreshDesktopSessionDependencies {
  isOnline: () => boolean;
  remoteGateway: Pick<AuthRemoteGateway, 'createRefreshUrl' | 'refreshToken'>;
  logger: AuthFlowLogger;
  onSuccess?: (response: RefreshSessionResponse, request: RefreshSessionRequest) => Promise<void>;
}

export async function refreshDesktopSession(
  request: RefreshSessionRequest,
  dependencies: RefreshDesktopSessionDependencies,
): Promise<DesktopRefreshResult> {
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
      const message = response.data.error || `刷新失败 (${response.status})`;
      logger.info('Remote refresh rejected', { status: response.status, message });

      return {
        ok: false,
        error: createTerminalAuthError('REFRESH_FAILED', message),
      };
    }

    if (onSuccess) {
      await onSuccess(response.data, request);
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
