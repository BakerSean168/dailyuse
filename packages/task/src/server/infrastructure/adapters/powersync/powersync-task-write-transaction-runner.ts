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
import { toTaskGoalOutboxRecord } from '../../task-goal-outbox';

export class PowerSyncTaskWriteTransactionRunner implements TaskWriteTransactionRunner {
  constructor(
    private readonly db: IElectronDatabase,
    private readonly eventPublisher: IEventBus = committedTaskWriteEventBus,
  ) {}

  async run<T>(work: (repositories: TaskWriteRepositories) => Promise<T>): Promise<T> {
    const bufferedEventBus = new BufferedTaskWriteEventBus();

    let postCommitEvents: import('@memoflow/contracts/shared').IDomainEvent[] = [];
    const result = await this.db.writeTransaction(async (tx: IElectronDatabaseTransaction) => {
      const result = await work({
        templateRepository: new PowerSyncTaskTemplateRepository(tx, bufferedEventBus),
        instanceRepository: new PowerSyncTaskInstanceRepository(tx, bufferedEventBus),
      });
      const events = bufferedEventBus.drain();
      const eventsToPublish = [];
      for (const event of events) {
        const record = toTaskGoalOutboxRecord(event);
        if (record) {
          await tx.execute(
            `INSERT OR IGNORE INTO task_goal_outbox (id, identity_id, task_instance_id, task_template_id, goal_id, key_result_id, payload, status, attempts, available_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?, ?, ?)`,
            [
              record.eventId,
              record.identityId,
              record.taskInstanceId,
              record.taskTemplateId,
              record.goalId,
              record.keyResultId,
              record.payload,
              record.occurredAt.toISOString(),
              record.occurredAt.toISOString(),
              record.occurredAt.toISOString(),
            ],
          );
        } else {
          eventsToPublish.push(event);
        }
      }
      postCommitEvents = eventsToPublish;
      return result;
    });

    await bufferedEventBus.flushEvents(this.eventPublisher, postCommitEvents);
    return result;
  }
}
