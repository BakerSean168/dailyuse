import type { PrismaClient } from '@memoflow/database';

export interface AccountClosedPayload {
  identityId: string;
  closedAt: number;
}

export class NotificationAccountClosedConsumer {
  constructor(private readonly prisma: PrismaClient) {}

  async handleAccountClosed(event: AccountClosedPayload, eventId: string): Promise<void> {
    const consumerName = 'notification-account-closed';
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
      // Cancel pending dispatches for identity
      await tx.notificationDispatchOutbox.updateMany({
        where: {
          identityId: event.identityId,
          status: { in: ['pending', 'claimed', 'sending'] },
        },
        data: {
          status: 'cancelled',
          deadLetterAt: new Date(),
          lastError: 'Account closed',
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
