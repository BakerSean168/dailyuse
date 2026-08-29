import type { IElectronDatabase, IElectronDatabaseTransaction } from '@memoflow/contracts/electron';
import type { NotificationRequestedWriterPort } from '@memoflow/contracts/notification';
import type {
  ReminderScheduleExecutionCommitInput,
  ReminderScheduleExecutionCommitPort,
  ReminderScheduleExecutionCommitResult,
} from '../../schedule-execution-commit.port';
import { ReminderTemplatePowerSyncRepository } from './reminder-template-powersync.repository';

export class ReminderScheduleExecutionPowerSyncCommitAdapter implements ReminderScheduleExecutionCommitPort {
  private readonly repository: ReminderTemplatePowerSyncRepository;

  constructor(
    private readonly db: IElectronDatabase,
    private readonly requestedWriter: NotificationRequestedWriterPort,
  ) {
    this.repository = new ReminderTemplatePowerSyncRepository(db);
  }

  async commit(
    input: ReminderScheduleExecutionCommitInput,
  ): Promise<ReminderScheduleExecutionCommitResult> {
    const identityId = String(input.template.identityId);
    const templateId = String(input.template.id);

    const result = await this.db.writeTransaction(async (tx: IElectronDatabaseTransaction) => {
      const current = await tx.getOptional<{ next_trigger_at: string | null }>(
        `SELECT next_trigger_at FROM reminder_templates WHERE id = ? AND identity_id = ? LIMIT 1`,
        [templateId, identityId],
      );
      const currentNextRunAt = current?.next_trigger_at
        ? new Date(current.next_trigger_at).getTime()
        : null;
      if (!current || currentNextRunAt !== input.expectedNextTriggerAt) {
        return {
          applied: false,
          nextRunAt: currentNextRunAt,
          notificationOperationId: null,
        };
      }

      await this.repository.saveWithinTransaction(tx, input.template);
      const receipt = await this.requestedWriter.enqueueNotificationRequested(
        input.notificationRequested,
        { txClient: tx },
      );
      return {
        applied: true,
        nextRunAt: input.template.nextTriggerAt,
        notificationOperationId: receipt.operationId,
      };
    });

    if (result.applied) {
      await this.repository.publishPersistedEvents(input.template);
    }
    return result;
  }
}
