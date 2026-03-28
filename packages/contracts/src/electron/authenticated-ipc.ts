import { fail, ok, type IpcResult } from '../result';
import type { IElectronModuleContext } from './index';
import type { Context } from '../shared';
import { isElectronAuthResolutionError } from './auth-context';

type UnexpectedErrorCode = 'INTERNAL_ERROR';

export interface AuthenticatedIpcWrapperOptions {
  authRequiredMessage?: string;
  authRestoringMessage?: string;
  unexpectedErrorCode?: UnexpectedErrorCode;
  unexpectedErrorMessage?: string;
}

export interface AuthenticatedIdentityIpcWrapperOptions extends AuthenticatedIpcWrapperOptions {}

function isIpcResult<T>(value: unknown): value is IpcResult<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    typeof (value as { ok?: unknown }).ok === 'boolean' &&
    ('data' in value || 'error' in value)
  );
}

export function createAuthenticatedIpcWrapper(options: AuthenticatedIpcWrapperOptions = {}) {
  const authRequiredMessage = options.authRequiredMessage ?? 'Authentication required';
  const authRestoringMessage = options.authRestoringMessage ?? 'Authentication restore in progress';
  const unexpectedErrorCode = options.unexpectedErrorCode ?? 'INTERNAL_ERROR';
  const unexpectedErrorMessage = options.unexpectedErrorMessage ?? 'Internal IPC error';

  return async function withAuthenticatedValue<T>(
    ctx: IElectronModuleContext,
    handler: (requestContext: Context) => Promise<IpcResult<T> | T>,
  ): Promise<IpcResult<T>> {
    try {
      const requestContext = await ctx.auth.requireRequestContext();
      const result = await handler(requestContext);
      return isIpcResult<T>(result) ? result : ok(result);
    } catch (error) {
      if (isElectronAuthResolutionError(error)) {
        return fail({
          code: error.code,
          message: error.code === 'AUTH_REQUIRED' ? authRequiredMessage : authRestoringMessage,
        });
      }

      return fail({ code: unexpectedErrorCode, message: unexpectedErrorMessage });
    }
  };
}

export const withAuthenticatedValue = createAuthenticatedIpcWrapper();

export function createAuthenticatedIdentityIpcWrapper(
  options: AuthenticatedIdentityIpcWrapperOptions = {},
) {
  const withAuthenticatedContext = createAuthenticatedIpcWrapper(options);

  return function withAuthenticatedIdentity<T>(
    ctx: IElectronModuleContext,
    handler: (identityId: string) => Promise<IpcResult<T> | T>,
  ): Promise<IpcResult<T>> {
    return withAuthenticatedContext(ctx, (requestContext) => handler(requestContext.identityId));
  };
}

export const withAuthenticatedIdentity = createAuthenticatedIdentityIpcWrapper();
