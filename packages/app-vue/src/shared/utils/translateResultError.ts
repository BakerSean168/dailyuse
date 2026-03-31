import type { ResultError } from '@dailyuse/contracts/result';

type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

interface TranslateResultErrorOptions {
  scope?: string;
  fallbackKey?: string;
}

function normalizeErrorLike(error: unknown): ResultError | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const candidate = error as Partial<ResultError>;
  return {
    code: typeof candidate.code === 'string' ? candidate.code : 'UNKNOWN',
    message: typeof candidate.message === 'string' ? candidate.message : '',
    details: Array.isArray(candidate.details) ? candidate.details : undefined,
    context:
      candidate.context && typeof candidate.context === 'object'
        ? candidate.context
        : undefined,
  };
}

function resolveCodeFallback(code: string): string | null {
  switch (code) {
    case 'USER_ALREADY_EXISTS':
      return 'CONFLICT';
    case 'AUTH_REQUIRED':
      return 'UNAUTHORIZED';
    case 'ACCESS_DENIED':
      return 'FORBIDDEN';
    case 'ENTITY_NOT_FOUND':
      return 'NOT_FOUND';
    case 'VALIDATION_FAILED':
      return 'VALIDATION_ERROR';
    case 'REQUEST_TIMEOUT':
      return 'TIMEOUT';
    default:
      return null;
  }
}

function translateByKey(
  t: TranslateFn,
  key: string | null | undefined,
  params?: Record<string, unknown>,
): string | null {
  if (!key) {
    return null;
  }

  const translated = t(key, params);
  return translated !== key ? translated : null;
}

export function translateResultError(
  error: unknown,
  t: TranslateFn,
  options: TranslateResultErrorOptions = {},
): string {
  const normalized = normalizeErrorLike(error);
  const params = normalized?.context;
  const code = normalized?.code ?? 'UNKNOWN';
  const fallbackCode = resolveCodeFallback(code);
  const candidates = [
    options.scope ? `${options.scope}.errors.${code}` : null,
    options.scope && fallbackCode ? `${options.scope}.errors.${fallbackCode}` : null,
    `errors.${code}`,
    fallbackCode ? `errors.${fallbackCode}` : null,
    options.fallbackKey ?? null,
    'common.operationFailed',
  ];

  for (const key of candidates) {
    const translated = translateByKey(t, key, params);
    if (translated) {
      return translated;
    }
  }

  return normalized?.message || 'Operation failed';
}
