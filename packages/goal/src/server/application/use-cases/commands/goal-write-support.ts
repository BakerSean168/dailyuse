import type { IGoalRecordRepository, IGoalRepository } from '../../../domain';

export interface GoalWriteRepositories {
  readonly goalRepository: IGoalRepository;
  readonly goalRecordRepository: IGoalRecordRepository;
}

export interface GoalWriteTransactionRunner {
  run<T>(work: (repositories: GoalWriteRepositories) => Promise<T>): Promise<T>;
}

export function createInlineGoalWriteTransactionRunner(
  repositories: GoalWriteRepositories,
): GoalWriteTransactionRunner {
  return { run: (work) => work(repositories) };
}
