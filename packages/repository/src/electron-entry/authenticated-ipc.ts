import { fail, ok, type IpcResult } from '@dailyuse/contracts/result';
import type { IElectronModuleContext } from '@dailyuse/contracts/electron';
import type { Context } from '@dailyuse/contracts/shared';

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
    return fail({ code: 'AUTH_RESTORING', message: 'Authentication restore in progress' });
  }

  return fail({ code: 'AUTH_REQUIRED', message: 'Authentication required' });
}

/**
 * Wrapper for IPC handlers that require authentication.
 * IPC 处理器的认证包装器。
 *
 * Resolves the authenticated context from the module context and passes it to
 * the handler. Returns an auth error if the user is not authenticated.
 *
 * 从模块上下文解析已认证的上下文并传递给处理器。
 * 如果用户未认证，则返回认证错误。
 */
export async function withAuthenticatedValue<T>(
  ctx: IElectronModuleContext,
  handler: (requestContext: Context) => Promise<IpcResult<T> | T>,
): Promise<IpcResult<T>> {
  try {
    const requestContext = await ctx.auth.requireRequestContext();
    const result = await handler(requestContext);
    return isIpcResult<T>(result) ? result : ok(result);
  } catch (error) {
    return toAuthResolutionResult<T>(error);
  }
}
