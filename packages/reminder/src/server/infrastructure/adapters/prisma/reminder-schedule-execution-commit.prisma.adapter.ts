import type { PrismaClient, Prisma } from '@memoflow/database';
import type { NotificationRequestedWriterPort } from '@memoflow/contracts/notification';
import type {
  ReminderScheduleExecutionCommitInput,
  ReminderScheduleExecutionCommitPort,
  ReminderScheduleExecutionCommitResult,
} from '../../schedule-execution-commit.port';
import { ReminderTemplatePrismaRepository } from './reminder-template-prisma.repository';

export class ReminderScheduleExecutionPrismaCommitAdapter implements ReminderScheduleExecutionCommitPort {
  private readonly repository: ReminderTemplatePrismaRepository;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly requestedWriter: NotificationRequestedWriterPort,
  ) {
    this.repository = new ReminderTemplatePrismaRepository(prisma);
  }

  async commit(
    input: ReminderScheduleExecutionCommitInput,
  ): Promise<ReminderScheduleExecutionCommitResult> {
    const identityId = String(input.template.identityId);
    const templateId = String(input.template.id);

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const current = await tx.reminderTemplate.findFirst({
        where: { id: templateId, identityId },
        select: { nextTriggerAt: true },
      });
      const currentNextRunAt = current?.nextTriggerAt?.getTime() ?? null;
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
