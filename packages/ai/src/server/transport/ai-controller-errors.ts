import { fail } from '@memoflow/contracts/result';
import { extractErrorInfo } from '@memoflow/utils/errors';
import { isAIExecutionError } from '../../shared/ai-execution-error';

export function toAIControllerFailure(error: unknown, fallbackMessage: string) {
  const errorInfo = extractErrorInfo(error);
  const structuredCode = isAIExecutionError(error)
    ? mapAIExecutionCategory(error.category)
    : errorInfo.code === 'UNKNOWN_ERROR'
      ? 'INTERNAL_ERROR'
      : errorInfo.code;

  return fail({
    code: structuredCode,
    message:
      structuredCode === 'INTERNAL_ERROR'
        ? fallbackMessage
        : safeAIControllerMessage(structuredCode),
    context:
      isAIExecutionError(error) && error.requestId ? { requestId: error.requestId } : undefined,
    cause: error,
  });
}

function mapAIExecutionCategory(
  category: import('../../shared/ai-execution-error').AIExecutionErrorKind,
): string {
  switch (category) {
    case 'rate_limited':
      return 'RATE_LIMITED';
    case 'unauthorized':
      return 'PROVIDER_AUTH_FAILED';
    case 'model_not_available':
      return 'MODEL_NOT_AVAILABLE';
    case 'timeout':
      return 'TIMEOUT';
    case 'validation':
    case 'structured_output':
      return 'VALIDATION_ERROR';
    case 'not_found':
      return 'NOT_FOUND';
    case 'aborted':
      return 'CANCELED';
    case 'provider_unavailable':
    case 'upstream_provider_error':
    case 'transport':
      return 'SERVICE_UNAVAILABLE';
    case 'conflict':
      return 'CONFLICT';
    case 'internal':
      return 'INTERNAL_ERROR';
  }
}

function safeAIControllerMessage(code: string): string {
  switch (code) {
    case 'RATE_LIMITED':
      return 'AI provider rate limit exceeded';
    case 'PROVIDER_AUTH_FAILED':
      return 'AI provider authentication failed';
    case 'MODEL_NOT_AVAILABLE':
      return 'AI model is not available';
    case 'TIMEOUT':
      return 'AI request timed out';
    case 'VALIDATION_ERROR':
      return 'AI response validation failed';
    case 'NOT_FOUND':
      return 'AI resource was not found';
    case 'CANCELED':
      return 'AI request was canceled';
    case 'SERVICE_UNAVAILABLE':
      return 'AI service is unavailable';
    case 'CONFLICT':
      return 'AI operation conflicts with current state';
    default:
      return 'AI request failed';
  }
}
