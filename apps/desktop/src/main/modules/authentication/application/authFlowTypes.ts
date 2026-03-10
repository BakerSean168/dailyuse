export type AuthFlowErrorCode =
  | 'OFFLINE'
  | 'REMOTE_UNREACHABLE'
  | 'CONFIG_ERROR'
  | 'INTERNAL_ERROR'
  | 'AUTH_FAILED'
  | 'REGISTER_FAILED'
  | 'REFRESH_FAILED'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'REGISTER_ERROR';

export interface AuthFlowError {
  code: AuthFlowErrorCode;
  message: string;
  shouldFallbackToOffline: boolean;
}

export type AuthFlowResult<T> = { ok: true; response: T } | { ok: false; error: AuthFlowError };

export interface AuthFlowLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export function createOfflineAuthError(message: string): AuthFlowError {
  return {
    code: 'OFFLINE',
    message,
    shouldFallbackToOffline: true,
  };
}

export function createRemoteUnreachableError(message: string): AuthFlowError {
  return {
    code: 'REMOTE_UNREACHABLE',
    message,
    shouldFallbackToOffline: true,
  };
}

export function createConfigError(message: string): AuthFlowError {
  return {
    code: 'CONFIG_ERROR',
    message,
    shouldFallbackToOffline: false,
  };
}

export function createInternalError(message: string): AuthFlowError {
  return {
    code: 'INTERNAL_ERROR',
    message,
    shouldFallbackToOffline: false,
  };
}

export function createTerminalAuthError(
  code: Exclude<AuthFlowErrorCode, 'OFFLINE' | 'REMOTE_UNREACHABLE'>,
  message: string,
): AuthFlowError {
  return {
    code,
    message,
    shouldFallbackToOffline: false,
  };
}
