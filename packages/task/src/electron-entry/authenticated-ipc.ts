import { fail, ok, type IpcResult } from '@dailyuse/contracts/result';
import type { IElectronModuleContext } from '@dailyuse/contracts/electron';
import type { Context } from '@dailyuse/contracts/shared';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskAuthenticatedIPC');

function isIpcResult<T>(value: unknown): value is IpcResult<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    typeof (value as { ok?: unknown }).ok === 'boolean' &&
    ('data' in value || 'error' in value)
  );
}

function toAuthResolutionResult<T>(error: unknown): IpcResult<T> {
  if (error instanceof Error && error.message === 'AUTH_RESTORING') {
    logger.warn('Auth context resolving: still restoring');
    return fail({ code: 'AUTH_RESTORING', message: 'Authentication restore in progress' });
  }

  if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
    logger.warn('Auth context unavailable for task IPC');
    return fail({ code: 'AUTH_REQUIRED', message: 'Authentication required' });
  }

  logger.error('Unexpected task IPC error while resolving auth context', { error });
  return fail({ code: 'INTERNAL_ERROR', message: 'Internal task IPC error' });
}

export async function withAuthenticatedValue<T>(
  ctx: IElectronModuleContext,
  handler: (requestContext: Context) => Promise<IpcResult<T> | T>,
): Promise<IpcResult<T>> {
  try {
    const requestContext = await ctx.auth.requireRequestContext();
    logger.debug('Resolved auth request context for task IPC', {
      identityId: requestContext.identityId,
      deviceId: requestContext.deviceId,
    });
    const result = await handler(requestContext);
    return isIpcResult<T>(result) ? result : ok(result);
  } catch (error) {
    return toAuthResolutionResult<T>(error);
  }
}
