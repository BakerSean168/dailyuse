import type { PrismaClient } from '@memoflow/database';
import type {
  AccountClosureEventPublisher,
  AccountClosedEventPayload,
} from '../../../application/ports/account-closure-event-publisher.port';

export class AccountClosureOutboxEventPublisher implements AccountClosureEventPublisher {
  constructor(private readonly prisma: PrismaClient) {}

  async publishAccountClosed(event: AccountClosedEventPayload): Promise<void> {
    const idempotencyKey = event.eventId ?? `account-closed:${event.identityId}`;
    const id = event.eventId ?? crypto.randomUUID();
    await this.prisma.outboxMessage.upsert({
      where: { idempotencyKey },
      update: {
        payloadJson: JSON.stringify(event),
      },
      create: {
        id,
        identityId: event.identityId,
        messageType: 'account:closed',
        schemaVersion: 1,
        correlationId: event.identityId,
        payloadJson: JSON.stringify(event),
        idempotencyKey,
        status: 'pending',
        attempts: 0,
        availableAt: new Date(),
      },
    });
  }
}
