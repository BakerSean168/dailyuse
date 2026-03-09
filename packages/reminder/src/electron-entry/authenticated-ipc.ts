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

function toUnauthorizedResult<T>(): IpcResult<T> {
  return fail({ code: 'AUTH_REQUIRED', message: 'Authentication required' });
}

export async function withAuthenticatedValue<T>(
  ctx: IElectronModuleContext,
  handler: (requestContext: Context) => Promise<IpcResult<T> | T>,
): Promise<IpcResult<T>> {
  try {
    const requestContext = await ctx.auth.requireRequestContext();
    const result = await handler(requestContext);
    return isIpcResult<T>(result) ? result : ok(result);
  } catch {
    return toUnauthorizedResult<T>();
  }
}
