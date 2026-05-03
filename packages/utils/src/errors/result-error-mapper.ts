import type { ResultError } from '@dailyuse/contracts/result';
import { extractStructuredResultError } from '@dailyuse/contracts/result';
import { isDomainError } from './DomainError';
import { mapPrismaError } from './prisma-error-mapper';

/**
 * Maps unknown infrastructure/application errors into the canonical ResultError shape.
 */
export function mapInfraErrorToResultError(
  error: unknown,
  fallbackMessage = 'Operation failed',
): ResultError {
  const structured = extractStructuredResultError(error);
  if (structured) {
    return structured;
  }

  if (isDomainError(error)) {
    return {
      code: error.code,
      message: error.message,
      context: error.context,
      cause: error.originalError ?? error,
    };
  }

  const prismaMapping = mapPrismaError(error);
  if (prismaMapping) {
    return {
      code: prismaMapping.resultCode,
      message: prismaMapping.message,
      cause: error,
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    message: fallbackMessage,
    cause: error,
  };
}
