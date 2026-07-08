import type { ResultError } from '@dailyuse/contracts/result';
import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import { isDomainError, mapInfraErrorToResultError } from '@dailyuse/utils/errors';

export interface TaskWriteRepositories {
  readonly templateRepository: ITaskTemplateRepository;
  readonly instanceRepository: ITaskInstanceRepository;
}

export interface TaskWriteTransactionRunner {
  run<T>(work: (repositories: TaskWriteRepositories) => Promise<T>): Promise<T>;
}

export function createInlineTaskWriteTransactionRunner(
  repositories: TaskWriteRepositories,
): TaskWriteTransactionRunner {
  return {
    run: (work) => work(repositories),
  };
}

export function mapTaskWriteErrorToResultError(
  error: unknown,
  fallbackMessage: string,
): ResultError {
  if (isDomainError(error)) {
    return {
      code: 'BAD_REQUEST',
      message: error.message,
      context: error.context,
      cause: error.originalError ?? error,
    };
  }

  return mapInfraErrorToResultError(error, fallbackMessage);
}
