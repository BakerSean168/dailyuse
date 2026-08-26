import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'crypto';
import { buildIdempotencyKeyString } from '@memoflow/contracts/reliable-messaging';
import {
  NotificationRequestedSchema,
  type NotificationRequested,
} from '@memoflow/contracts/notification';
import { NotificationRequestedPrismaWriterAdapter } from '../notification-requested-writer.prisma.adapter';
import { NotificationPrismaRepository } from '../notification-prisma.repository';
import { NotificationPreferencePrismaRepository } from '../notification-preference-prisma.repository';
import { NotificationReliableOperationPrismaAdapter } from '../notification-reliable-operation-prisma.adapter';
import {
  createNotificationRuntimeContribution,
  type NotificationReliableOperationPort,
} from '../../../runtime/notification.runtime';
import { RealInAppChannelDeliverer } from '../../deliverers/real-channel-deliverers';
import { NotificationPreference } from '../../../../domain/aggregates/notification-preference';
import {
  cleanAll,
  disconnectPrisma,
  getPrisma,
  seedAccount,
} from '@memoflow/test-utils/setup/integration-helpers';

describe('NotificationRequested durable envelope consumer (NOTIF-3301)', () => {
  let prisma: ReturnType<typeof getPrisma>;
  let reliableAdapter: NotificationReliableOperationPrismaAdapter;
  let notificationRepo: NotificationPrismaRepository;
  let preferenceRepo: NotificationPreferencePrismaRepository;
  let writer: NotificationRequestedPrismaWriterAdapter;
  let identityId: string;

  beforeEach(async () => {
    prisma = await getPrisma();
    await cleanAll();
    identityId = `identity_${randomUUID()}`;
    await seedAccount({ id: identityId });

    reliableAdapter = new NotificationReliableOperationPrismaAdapter(prisma);
    notificationRepo = new NotificationPrismaRepository(prisma);
    preferenceRepo = new NotificationPreferencePrismaRepository(prisma);
    writer = new NotificationRequestedPrismaWriterAdapter(prisma);
  });

  afterAll(async () => {
    if (prisma) {
      await cleanAll();
      await disconnectPrisma();
    }
  });

  function buildEnvelope(overrides: Partial<NotificationRequested> = {}): NotificationRequested {
    const occurrenceKey = `reminder:${randomUUID()}`;
    return NotificationRequestedSchema.parse({
      identityId,
      occurrenceKey,
      idempotencyKey: buildIdempotencyKeyString({
        identityId,
        source: 'notification',
        occurrenceKey,
      }),
      workflowKey: 'system.general',
      content: { title: 'Durable notification', content: 'Body of the notification' },
      ...overrides,
    });
  }

  function buildRuntime() {
    return createNotificationRuntimeContribution({
      environment: 'test',
      ownerToken: `worker-${randomUUID()}`,
      repository: notificationRepo,
      preferenceRepository: preferenceRepo,
      closureChecker: async () => false,
      reliableAdapter: reliableAdapter as NotificationReliableOperationPort,
      deliverer: new RealInAppChannelDeliverer(notificationRepo),
    });
  }

  it('1. Writes the notification.requested envelope durably; handler commit never touches a deliverer', async () => {
    const opId = randomUUID();
    const envelope = buildEnvelope();

    const receipt = await writer.enqueueNotificationRequested({ operationId: opId, envelope });

    expect(receipt.status).toBe('pending');
    expect(receipt.operationId).toBe(opId);
    expect(receipt.idempotencyKey).toBe(envelope.idempotencyKey);

    const shared = await prisma.outboxMessage.findUniqueOrThrow({ where: { id: opId } });
    expect(shared.messageType).toBe('notification.requested');
    expect(shared.status).toBe('pending');
    // No Fact materialized at write time.
    expect(
      await prisma.notification.count({ where: { identityId, idempotencyKey: envelope.idempotencyKey } }),
    ).toBe(0);
  });

  it('2. Consumes the envelope into exactly one Fact + dispatch outbox, then delivers through the durable path', async () => {
    const opId = randomUUID();
    const envelope = buildEnvelope();
    await writer.enqueueNotificationRequested({ operationId: opId, envelope });
    const runtime = buildRuntime();

    await runtime.tick();

    // Materialization committed; shared envelope marked succeeded.
    const shared = await prisma.outboxMessage.findUniqueOrThrow({ where: { id: opId } });
    expect(shared.status).toBe('succeeded');

    const fact = await prisma.notification.findFirstOrThrow({
      where: { identityId, idempotencyKey: envelope.idempotencyKey },
    });
    expect(fact.workflowKey).toBe(envelope.workflowKey);
    expect(fact.title).toBe('Durable notification');
    expect(fact.correlationId).toBeNull();

    const dispatchRows = await prisma.notificationDispatchOutbox.findMany({
      where: { notificationId: fact.id },
    });
    expect(dispatchRows).toHaveLength(1);
    expect(dispatchRows[0].channel).toBe('InApp');
    expect(dispatchRows[0].status).toBe('pending');

    // Next tick delivers the created dispatch outbox through the standard durable path.
    await runtime.tick();
    const delivered = await prisma.notificationDispatchOutbox.findUniqueOrThrow({
      where: { id: dispatchRows[0].id },
    });
    expect(delivered.status).toBe('succeeded');
    const channel = await prisma.notificationChannel.findFirstOrThrow({
      where: { notificationId: fact.id },
    });
    expect(channel.status).toBe('Delivered');
    expect(channel.sentAt).not.toBeNull();
  });

  it('3. Replay after crash-after-Fact commit keeps exactly one Fact and one dispatch outbox', async () => {
    const opId = randomUUID();
    const envelope = buildEnvelope();
    await writer.enqueueNotificationRequested({ operationId: opId, envelope });
    const runtime = buildRuntime();

    await runtime.tick();
    const factBefore = await prisma.notification.findFirstOrThrow({
      where: { identityId, idempotencyKey: envelope.idempotencyKey },
    });

    // Simulate crash-after-Fact-commit but BEFORE the shared status write:
    // the row becomes claimable again and a fresh worker reprocesses it.
    await prisma.outboxMessage.update({
      where: { id: opId },
      data: {
        status: 'pending',
        attempts: 1,
        ownerToken: null,
        claimId: null,
        fencingToken: null,
        lastHeartbeatAt: null,
        lastError: null,
        leaseExpiresAt: new Date(Date.now() - 60_000),
      },
    });

    await runtime.tick();

    const facts = await prisma.notification.count({
      where: { identityId, idempotencyKey: envelope.idempotencyKey },
    });
    expect(facts).toBe(1);
    const dispatch = await prisma.notificationDispatchOutbox.count({
      where: { notificationId: factBefore.id },
    });
    expect(dispatch).toBe(1);
    const shared = await prisma.outboxMessage.findUniqueOrThrow({ where: { id: opId } });
    expect(shared.status).toBe('succeeded');
  });

  it('4. Per-channel policy is evaluated at consumption: disabled InApp yields no dispatch + observable decision', async () => {
    const preference = NotificationPreference.create({ identityId: identityId as never });
    preference.setGlobalChannel('InApp', false);
    await preferenceRepo.save(preference);

    const opId = randomUUID();
    const envelope = buildEnvelope();
    await writer.enqueueNotificationRequested({ operationId: opId, envelope });
    const runtime = buildRuntime();

    await runtime.tick();

    const fact = await prisma.notification.findFirstOrThrow({
      where: { identityId, idempotencyKey: envelope.idempotencyKey },
    });
    // The Fact is still durable; only the channel plan was suppressed.
    const dispatch = await prisma.notificationDispatchOutbox.count({
      where: { notificationId: fact.id },
    });
    expect(dispatch).toBe(0);

    const decision = await prisma.notificationDeliveryDecisionRecord.findFirstOrThrow({
      where: { notificationId: fact.id, channel: 'InApp' },
    });
    expect(decision.outcome).toBe('disabled');
    const shared = await prisma.outboxMessage.findUniqueOrThrow({ where: { id: opId } });
    expect(shared.status).toBe('succeeded');
  });

  it('5. Writer enqueue is idempotent by operationId (re-enqueue returns the existing receipt)', async () => {
    const opId = randomUUID();
    const envelope = buildEnvelope();

    const first = await writer.enqueueNotificationRequested({ operationId: opId, envelope });
    const second = await writer.enqueueNotificationRequested({ operationId: opId, envelope });

    expect(second.operationId).toBe(first.operationId);
    expect(second.idempotencyKey).toBe(first.idempotencyKey);
    expect(second.status).toBe('pending');
    expect(
      await prisma.outboxMessage.count({ where: { id: opId } }),
    ).toBe(1);
  });
});