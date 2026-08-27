import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'crypto';
import { buildIdempotencyKeyString } from '@memoflow/contracts/reliable-messaging';
import {
  NotificationCategory,
  NotificationChannelType as ChannelTypeEnum,
  NotificationRequestedSchema,
  NotificationType,
  RelatedEntityType,
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
    // Correlation fallback is materialized from the durable shared-outbox value
    // (writer resolves envelope -> input -> operationId), never dropped pre-Fact.
    expect(fact.correlationId).toBe(opId);
    expect(fact.causationId).toBeNull();

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

  it('6. Envelope-level idempotency: a retry with a NEW operationId reconciles to the durable row pinned by idempotencyKey', async () => {
    const originalOpId = randomUUID();
    const retryOpId = randomUUID();
    const envelope = buildEnvelope();

    const first = await writer.enqueueNotificationRequested({ operationId: originalOpId, envelope });
    // Crash/replay retry that generated a fresh operationId for the SAME envelope.
    const retried = await writer.enqueueNotificationRequested({ operationId: retryOpId, envelope });

    expect(retried.operationId).toBe(first.operationId);
    expect(retried.idempotencyKey).toBe(envelope.idempotencyKey);
    expect(retried.status).toBe('pending');
    // Exactly one durable row: the retry must not create a second row nor throw
    // the unique-idempotencyKey violation.
    expect(await prisma.outboxMessage.count({ where: { idempotencyKey: envelope.idempotencyKey } })).toBe(1);
    expect(await prisma.outboxMessage.count({ where: { id: retryOpId } })).toBe(0);

    // The re-claimed envelope still consumes into exactly one Fact + dispatch.
    const runtime = buildRuntime();
    await runtime.tick();
    const facts = await prisma.notification.count({
      where: { identityId, idempotencyKey: envelope.idempotencyKey },
    });
    expect(facts).toBe(1);
    const shared = await prisma.outboxMessage.findUniqueOrThrow({ where: { id: first.operationId } });
    expect(shared.status).toBe('succeeded');
  });

  it('7. Writer-level correlation/causation fallbacks flow into the Notification Fact at consumption', async () => {
    const envelopeCorrelationId = `corr-${randomUUID()}`;
    const envelopeCausationId = `cause-${randomUUID()}`;
    const opId = randomUUID();
    const envelope = buildEnvelope({
      correlationId: envelopeCorrelationId,
      causationId: envelopeCausationId,
    });
    await writer.enqueueNotificationRequested({ operationId: opId, envelope });
    const runtime = buildRuntime();
    await runtime.tick();

    const fact = await prisma.notification.findFirstOrThrow({
      where: { identityId, idempotencyKey: envelope.idempotencyKey },
    });
    expect(fact.correlationId).toBe(envelopeCorrelationId);
    expect(fact.causationId).toBe(envelopeCausationId);

    // Input-level fallback (envelope omits both) is durable on the shared row and
    // materialized on the Fact.
    const inputCorrelationId = `input-corr-${randomUUID()}`;
    const inputCausationId = `input-cause-${randomUUID()}`;
    const opId2 = randomUUID();
    const envelope2 = buildEnvelope();
    await writer.enqueueNotificationRequested({
      operationId: opId2,
      envelope: envelope2,
      correlationId: inputCorrelationId,
      causationId: inputCausationId,
    });

    const shared2 = await prisma.outboxMessage.findUniqueOrThrow({ where: { id: opId2 } });
    expect(shared2.correlationId).toBe(inputCorrelationId);
    expect(shared2.causationId).toBe(inputCausationId);

    const runtime2 = buildRuntime();
    await runtime2.tick();
    const fact2 = await prisma.notification.findFirstOrThrow({
      where: { identityId, idempotencyKey: envelope2.idempotencyKey },
    });
    expect(fact2.correlationId).toBe(inputCorrelationId);
    expect(fact2.causationId).toBe(inputCausationId);
  });

  it('8. NOTIF-3302: a production task.reminder envelope materializes ONE Fact carrying the Task relatedEntity', async () => {
    const instanceId = `TaskInstanceId_${randomUUID()}`;
    const schedulingKey = `${instanceId}|2026-08-10T08:45:00.000Z`;
    const envelope = NotificationRequestedSchema.parse({
      identityId,
      source: 'task',
      occurrenceKey: schedulingKey,
      idempotencyKey: buildIdempotencyKeyString({
        identityId,
        source: 'task',
        occurrenceKey: schedulingKey,
      }),
      workflowKey: 'task.reminder',
      topic: 'task.reminder',
      relatedEntity: { type: RelatedEntityType.Task, id: instanceId },
      content: {
        title: '任务提醒：Ship R07',
        content: '任务「Ship R07」的提前 1day 提醒已到达。',
        type: NotificationType.Reminder,
        category: NotificationCategory.Task,
      },
      suggestedChannels: [ChannelTypeEnum.InApp, ChannelTypeEnum.Push],
      correlationId: schedulingKey,
      causationId: schedulingKey,
    });
    const opId = randomUUID();
    await writer.enqueueNotificationRequested({ operationId: opId, envelope });

    const runtime = buildRuntime();
    await runtime.tick();

    // Envelope consumed; no second Fact on replay (see tests 3/6).
    const shared = await prisma.outboxMessage.findUniqueOrThrow({ where: { id: opId } });
    expect(shared.status).toBe('succeeded');

    const fact = await prisma.notification.findFirstOrThrow({
      where: { identityId, idempotencyKey: envelope.idempotencyKey },
    });
    expect(fact.workflowKey).toBe('task.reminder');
    expect(fact.topic).toBe('task.reminder');
    expect(fact.type).toBe(NotificationType.Reminder);
    expect(fact.category).toBe(NotificationCategory.Task);
    expect(fact.relatedEntityType).toBe(RelatedEntityType.Task);
    expect(fact.relatedEntityId).toBe(instanceId);
    expect(fact.importance).toBe('Moderate');
    expect(fact.urgency).toBe('Medium');
    // Durable correlation chain authored by the task handler survives.
    expect(fact.correlationId).toBe(schedulingKey);
    expect(fact.causationId).toBe(schedulingKey);

    // Both suggested channels produce a policy decision + pending dispatch intent.
    const decisions = await prisma.notificationDeliveryDecisionRecord.findMany({
      where: { notificationId: fact.id },
    });
    expect(decisions.map((d) => d.channel).sort()).toEqual(['InApp', 'Push']);

    const dispatch = await prisma.notificationDispatchOutbox.findMany({
      where: { notificationId: fact.id },
    });
    expect(dispatch.map((d) => d.channel).sort()).toEqual(['InApp', 'Push']);
    expect(dispatch.every((d) => d.status === 'pending')).toBe(true);
  });

  it('9. NOTIF-3302: a production goal.reminder envelope materializes ONE Fact carrying the Goal relatedEntity', async () => {
    const goalId = `GoalId_${randomUUID()}`;
    const schedulingKey = `${goalId}|2026-08-10T08:45:00.000Z`;
    const envelope = NotificationRequestedSchema.parse({
      identityId,
      source: 'goal-reminder',
      occurrenceKey: schedulingKey,
      idempotencyKey: buildIdempotencyKeyString({
        identityId,
        source: 'goal-reminder',
        occurrenceKey: schedulingKey,
      }),
      workflowKey: 'goal.reminder',
      topic: 'goal.reminder',
      relatedEntity: { type: RelatedEntityType.Goal, id: goalId },
      content: {
        title: '目标提醒：Ship R06',
        content: '目标「Ship R06」距离截止还有 3 天。',
        type: NotificationType.Reminder,
        category: NotificationCategory.Goal,
      },
      suggestedChannels: [ChannelTypeEnum.InApp, ChannelTypeEnum.Push],
      correlationId: schedulingKey,
    });
    const opId = randomUUID();
    await writer.enqueueNotificationRequested({ operationId: opId, envelope });

    const runtime = buildRuntime();
    await runtime.tick();

    const shared = await prisma.outboxMessage.findUniqueOrThrow({ where: { id: opId } });
    expect(shared.status).toBe('succeeded');

    const fact = await prisma.notification.findFirstOrThrow({
      where: { identityId, idempotencyKey: envelope.idempotencyKey },
    });
    expect(fact.workflowKey).toBe('goal.reminder');
    expect(fact.topic).toBe('goal.reminder');
    expect(fact.type).toBe(NotificationType.Reminder);
    expect(fact.category).toBe(NotificationCategory.Goal);
    expect(fact.relatedEntityType).toBe(RelatedEntityType.Goal);
    expect(fact.relatedEntityId).toBe(goalId);
    expect(fact.importance).toBe('Moderate');
    expect(fact.urgency).toBe('Medium');
    expect(fact.correlationId).toBe(schedulingKey);
    expect(fact.causationId).toBeNull();

    const decisions = await prisma.notificationDeliveryDecisionRecord.findMany({
      where: { notificationId: fact.id },
    });
    expect(decisions.map((d) => d.channel).sort()).toEqual(['InApp', 'Push']);

    const dispatch = await prisma.notificationDispatchOutbox.findMany({
      where: { notificationId: fact.id },
    });
    expect(dispatch.map((d) => d.channel).sort()).toEqual(['InApp', 'Push']);
    expect(dispatch.every((d) => d.status === 'pending')).toBe(true);
  });
});