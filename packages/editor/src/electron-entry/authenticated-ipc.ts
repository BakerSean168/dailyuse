/**
 * Authenticated IPC helpers for the Editor module.
 * 编辑器模块的认证 IPC 辅助函数。
 *
 * Wraps IPC handlers with authentication context resolution.
 * 为 IPC 处理器包装认证上下文解析。
 *
 * @module editor/electron-entry/authenticated-ipc
 */

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

function toAuthResolutionResult<T>(error: unknown): IpcResult<T> {
  if (error instanceof Error && error.message === 'AUTH_RESTORING') {
    return fail({ code: 'AUTH_RESTORING', message: 'Authentication restore in progress' });
  }

  return toUnauthorizedResult<T>();
}

/**
 * Wraps an IPC handler with authenticated request context.
 * 为 IPC 处理器包装认证的请求上下文。
 *
 * @param ctx - The Electron module context containing auth provider
 * @param handler - The handler function that receives the authenticated context
 * @returns An IpcResult wrapping the handler's return value
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
