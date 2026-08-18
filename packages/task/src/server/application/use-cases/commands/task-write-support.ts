import { ResultErrorException, type ResultError } from '@memoflow/contracts/result';
import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import { mapInfraErrorToResultError } from '@memoflow/utils/errors';

export interface TaskWriteRepositories {
  /** 完整事务（complete 等）需要模板读取；仅实例操作（uncomplete）可省略。 */
  readonly templateRepository?: ITaskTemplateRepository;
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
  if (error instanceof ResultErrorException) {
    const ctx = (error as { context?: Record<string, unknown> }).context;
    const cause = (error as { cause?: unknown }).cause ?? error;
    return { code: 'BAD_REQUEST', message: error.message, context: ctx, cause };
  }

  return mapInfraErrorToResultError(error, fallbackMessage);
}
