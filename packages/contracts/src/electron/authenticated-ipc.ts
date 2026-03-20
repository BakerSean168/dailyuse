import { fail, ok, type IpcResult } from '../result';
import type { IElectronModuleContext } from './index';
import type { Context } from '../shared';

type UnexpectedErrorCode = 'AUTH_REQUIRED' | 'INTERNAL_ERROR';

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
  const unexpectedErrorCode = options.unexpectedErrorCode ?? 'AUTH_REQUIRED';
  const unexpectedErrorMessage = options.unexpectedErrorMessage ?? authRequiredMessage;

  return async function withAuthenticatedValue<T>(
    ctx: IElectronModuleContext,
    handler: (requestContext: Context) => Promise<IpcResult<T> | T>,
  ): Promise<IpcResult<T>> {
    try {
      const requestContext = await ctx.auth.requireRequestContext();
      const result = await handler(requestContext);
      return isIpcResult<T>(result) ? result : ok(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'AUTH_RESTORING') {
        return fail({ code: 'AUTH_RESTORING', message: authRestoringMessage });
      }

      if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
        return fail({ code: 'AUTH_REQUIRED', message: authRequiredMessage });
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
