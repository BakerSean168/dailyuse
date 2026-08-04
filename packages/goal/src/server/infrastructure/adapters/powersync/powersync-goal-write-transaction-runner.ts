import type { IElectronDatabase, IElectronDatabaseTransaction } from '@memoflow/contracts/electron';
import type { IEventBus } from '@memoflow/patterns';
import type {
  GoalWriteRepositories,
  GoalWriteTransactionRunner,
} from '../../../application/use-cases/commands/goal-write-support';
import {
  BufferedGoalWriteEventBus,
  committedGoalWriteEventBus,
} from '../goal-write-buffered-event-bus';
import { GoalPowerSyncRepository } from './goal-powersync.repository';
import { GoalRecordPowerSyncRepository } from './goal-record-powersync.repository';

export class PowerSyncGoalWriteTransactionRunner implements GoalWriteTransactionRunner {
  constructor(
    private readonly db: IElectronDatabase,
    private readonly eventPublisher: IEventBus = committedGoalWriteEventBus,
  ) {}

  async run<T>(work: (repositories: GoalWriteRepositories) => Promise<T>): Promise<T> {
    const bufferedEventBus = new BufferedGoalWriteEventBus();
    const result = await this.db.writeTransaction((tx: IElectronDatabaseTransaction) =>
      work({
        goalRepository: new GoalPowerSyncRepository(tx, bufferedEventBus, true),
        goalRecordRepository: new GoalRecordPowerSyncRepository(tx),
      }),
    );
    await bufferedEventBus.flush(this.eventPublisher);
    return result;
  }
}
