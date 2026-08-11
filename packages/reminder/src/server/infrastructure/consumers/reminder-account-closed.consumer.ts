import type { PrismaClient } from '@memoflow/database';

export interface AccountClosedPayload {
  identityId: string;
  closedAt: number;
}

export class ReminderAccountClosedConsumer {
  constructor(private readonly prisma: PrismaClient) {}

  async handleAccountClosed(event: AccountClosedPayload, eventId: string): Promise<void> {
    const consumerName = 'reminder-account-closed';
    const existing = await this.prisma.inboxReceipt.findUnique({
      where: {
        id_consumer: {
          id: eventId,
          consumer: consumerName,
        },
      },
    });

    if (existing) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      // Cancel pending occurrences for identity
      await tx.reminderOccurrence.updateMany({
        where: {
          identityId: event.identityId,
          status: { in: ['pending', 'claimed', 'running'] },
        },
        data: {
          status: 'cancelled',
          deadLetterAt: new Date(),
          lastError: 'Account closed',
        },
      });

      // Disable active reminder templates for identity
      await tx.reminderTemplate.updateMany({
        where: {
          identityId: event.identityId,
          status: 'active',
        },
        data: {
          status: 'disabled',
          updatedAt: new Date(),
        },
      });

      // Record durable InboxReceipt
      await tx.inboxReceipt.create({
        data: {
          id: eventId,
          consumer: consumerName,
          outcome: 'success',
          processedAt: new Date(),
        },
      });
    });
  }
}
