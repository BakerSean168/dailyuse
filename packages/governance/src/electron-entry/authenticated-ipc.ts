/**
 * Authenticated IPC Helper for Governance Module
 * 治理模块的认证 IPC 辅助函数
 *
 * Wraps IPC handlers with authentication context resolution.
 * 使用认证上下文解析包装 IPC 处理器。
 *
 * @module governance/electron-entry/authenticated-ipc
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

function toAuthResolutionResult<T>(error: unknown): IpcResult<T> {
  if (error instanceof Error && error.message === 'AUTH_RESTORING') {
    return fail({ code: 'AUTH_RESTORING', message: 'Authentication restore in progress' });
  }

  return fail({ code: 'AUTH_REQUIRED', message: 'Authentication required' });
}

/**
 * Wraps an IPC handler with authenticated request context.
 * 使用认证的请求上下文包装 IPC 处理器。
 *
 * @param ctx - Electron module context with auth provider
 * @param handler - Handler function receiving authenticated context
 * @returns IPC result with proper error handling for auth failures
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
