import type { IElectronDatabase, IElectronDatabaseTransaction } from '@memoflow/contracts/electron';
import type { IEventBus } from '@memoflow/patterns';
import type {
  TaskWriteRepositories,
  TaskWriteTransactionRunner,
} from '../../../application/use-cases/commands/task-write-support';
import {
  BufferedTaskWriteEventBus,
  committedTaskWriteEventBus,
} from '../task-write-buffered-event-bus';
import { PowerSyncTaskInstanceRepository } from './task-instance-powersync.repository';
import { PowerSyncTaskTemplateRepository } from './task-template-powersync.repository';

export class PowerSyncTaskWriteTransactionRunner implements TaskWriteTransactionRunner {
  constructor(
    private readonly db: IElectronDatabase,
    private readonly eventPublisher: IEventBus = committedTaskWriteEventBus,
  ) {}

  async run<T>(work: (repositories: TaskWriteRepositories) => Promise<T>): Promise<T> {
    const bufferedEventBus = new BufferedTaskWriteEventBus();

    const result = await this.db.writeTransaction(async (tx: IElectronDatabaseTransaction) =>
      work({
        templateRepository: new PowerSyncTaskTemplateRepository(tx, bufferedEventBus),
        instanceRepository: new PowerSyncTaskInstanceRepository(tx, bufferedEventBus),
      }),
    );

    await bufferedEventBus.flush(this.eventPublisher);
    return result;
  }
}
