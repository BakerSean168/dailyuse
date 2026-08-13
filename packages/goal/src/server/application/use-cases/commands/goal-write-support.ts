import type { IGoalRecordRepository, IGoalRepository } from '../../../domain';
import type {
  BusinessOperationReceipt,
  GoalRecordReceiptInput,
  GoalReliableOperationPort,
} from '@memoflow/contracts/reliable-messaging';

export interface GoalWriteRepositories {
  readonly goalRepository: IGoalRepository;
  readonly goalRecordRepository: IGoalRecordRepository;
}

export interface GoalWriteTransactionContext extends GoalWriteRepositories {
  readonly recordGoalCompletionReceipt: (
    input: GoalRecordReceiptInput,
  ) => Promise<BusinessOperationReceipt>;
}

export interface GoalWriteTransactionRunner {
  run<T>(work: (context: GoalWriteTransactionContext) => Promise<T>): Promise<T>;
}

export function createInlineGoalWriteTransactionRunner(
  repositories: GoalWriteRepositories,
  receiptPort: GoalReliableOperationPort,
): GoalWriteTransactionRunner {
  return {
    run: (work) =>
      work({
        ...repositories,
        recordGoalCompletionReceipt: (input) => receiptPort.recordGoalCompletionReceipt(input),
      }),
  };
}
