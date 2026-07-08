import { fail } from '@dailyuse/contracts/result';
import { extractErrorInfo, isDomainError } from '@dailyuse/utils/errors';

export function toAIControllerFailure(error: unknown, fallbackMessage: string) {
  const errorInfo = extractErrorInfo(error);
  const message = errorInfo.message || fallbackMessage;
  const providerStatusMatch = /Provider request failed:\s*(\d{3})/i.exec(message);
  const providerStatusCode = providerStatusMatch
    ? Number.parseInt(providerStatusMatch[1] ?? '', 10)
    : undefined;
  const normalizedCode =
    errorInfo.code === 'UNKNOWN_ERROR'
      ? providerStatusCode === 429 || /quota exceeded|rate limit|resource_exhausted/i.test(message)
        ? 'RATE_LIMITED'
        : providerStatusCode === 401 || providerStatusCode === 403
          ? 'PROVIDER_AUTH_FAILED'
          : providerStatusCode === 404 &&
              /models\/.+ is not found|not supported for generatecontent|model.*not found/i.test(
                message,
              )
            ? 'MODEL_NOT_AVAILABLE'
            : providerStatusCode && providerStatusCode >= 500
              ? 'SERVICE_UNAVAILABLE'
              : 'INTERNAL_ERROR'
      : errorInfo.code;

  return fail({
    code: normalizedCode,
    message,
    context: {
      ...(errorInfo.context ?? {}),
      ...(providerStatusCode ? { providerStatusCode } : {}),
      ...(isDomainError(error) ? { httpStatus: error.httpStatus } : {}),
    },
  });
}
