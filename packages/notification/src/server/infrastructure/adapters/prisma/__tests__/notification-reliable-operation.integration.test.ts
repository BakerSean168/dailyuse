import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'crypto';
import { buildIdempotencyKeyString } from '@memoflow/contracts/reliable-messaging';
import { NotificationType, NotificationCategory, NotificationChannelType } from '@memoflow/contracts/notification';
import { ReminderType } from '@memoflow/contracts/reminder';
import { NotificationReliableOperationPrismaAdapter } from '../notification-reliable-operation-prisma.adapter';
import { NotificationPrismaRepository } from '../notification-prisma.repository';
import { NotificationPreferencePrismaRepository } from '../notification-preference-prisma.repository';
import { NotificationTemplatePrismaRepository } from '../notification-template-prisma.repository';
import { CreateNotificationUseCase } from '../../../../application/use-cases/commands/create-notification.use-case';
import {
  createNotificationRuntimeContribution,
  type NotificationChannelDeliverer,
} from '../../../runtime/notification.runtime';
import { RealInAppChannelDeliverer } from '../../deliverers/real-channel-deliverers';
import {
  cleanAll,
  disconnectPrisma,
  getPrisma,
  seedAccount,
} from '@memoflow/test-utils/setup/integration-helpers';

describe('Notification Reliable Operation & Durable Dispatch Integration (W2)', () => {
  let prisma: ReturnType<typeof getPrisma>;
  let reliableAdapter: NotificationReliableOperationPrismaAdapter;
  let notificationRepo: NotificationPrismaRepository;
  let preferenceRepo: NotificationPreferencePrismaRepository;
  let templateRepo: NotificationTemplatePrismaRepository;
  let identityId: string;

  beforeEach(async () => {
    prisma = await getPrisma();
    await cleanAll();
    identityId = `identity_${randomUUID()}`;
    await seedAccount({ id: identityId });

    reliableAdapter = new NotificationReliableOperationPrismaAdapter(prisma);
    notificationRepo = new NotificationPrismaRepository(prisma);
    preferenceRepo = new NotificationPreferencePrismaRepository(prisma);
    templateRepo = new NotificationTemplatePrismaRepository(prisma);
  });

  async function seedNotification(id: string) {
    await prisma.notification.create({
      data: {
        id,
        identityId,
        title: 'Test Notification',
        content: 'Content',
        type: 'Info',
        category: 'System',
        importance: 'Normal',
        urgency: 'Normal',
        status: 'Pending',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        channels: {
          create: {
            id: randomUUID(),
            identityId,
            channelType: 'InApp',
            recipient: identityId,
            status: 'Pending',
            maxRetries: 3,
            retryCount: 0,
            attempts: 0,
          },
        },
      },
    });
  }

  afterAll(async () => {
    if (prisma) {
      await cleanAll();
      await disconnectPrisma();
    }
  });

  it('1. Atomic outbox dispatch creation with canonical idempotency key', async () => {
    const opId = randomUUID();
    const notificationId = 'notif_1';
    await seedNotification(notificationId);
    const occurrenceKey = `${notificationId}:${NotificationChannelType.InApp}`;
    const idempotencyKey = buildIdempotencyKeyString({
      identityId,
      source: 'notification',
      occurrenceKey,
    });

    const receipt = await reliableAdapter.dispatchOutbox(
      {
        operationId: opId,
        identityId,
        source: 'notification',
        occurrenceKey,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'Test', notificationId }),
        idempotencyKey,
      },
      { notificationId },
    );

    expect(receipt.status).toBe('pending');
    expect(receipt.operationId).toBe(opId);
    expect(receipt.idempotencyKey).toBe(idempotencyKey);
    expect(receipt.attempt).toBe(0);
  });

  it('2. Duplicate outbox dispatch returns existing receipt (Idempotency)', async () => {
    const opId = randomUUID();
    const notificationId = 'notif_dup';
    await seedNotification(notificationId);
    const occurrenceKey = `${notificationId}:${NotificationChannelType.InApp}`;
    const idempotencyKey = buildIdempotencyKeyString({
      identityId,
      source: 'notification',
      occurrenceKey,
    });

    const input = {
      operationId: opId,
      identityId,
      source: 'notification',
      occurrenceKey,
      channel: NotificationChannelType.InApp,
      payloadJson: JSON.stringify({ title: 'Dup Test', notificationId }),
      idempotencyKey,
    };

    const receipt1 = await reliableAdapter.dispatchOutbox(input, { notificationId });
    const receipt2 = await reliableAdapter.dispatchOutbox(input, { notificationId });

    expect(receipt1.operationId).toBe(receipt2.operationId);
    expect(receipt1.idempotencyKey).toBe(receipt2.idempotencyKey);

    const count = await prisma.notificationDispatchOutbox.count({
      where: { idempotencyKey },
    });
    expect(count).toBe(1);
  });

  it('3. Concurrent worker claim: exactly one worker claims outbox item', async () => {
    const opId = randomUUID();
    const notificationId = 'notif_claim';
    await seedNotification(notificationId);
    const occurrenceKey = `${notificationId}:${NotificationChannelType.InApp}`;
    const idempotencyKey = buildIdempotencyKeyString({
      identityId,
      source: 'notification',
      occurrenceKey,
    });

    await reliableAdapter.dispatchOutbox(
      {
        operationId: opId,
        identityId,
        source: 'notification',
        occurrenceKey,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'Claim Test', notificationId }),
        idempotencyKey,
      },
      { notificationId },
    );

    const worker1Claim = reliableAdapter.claimOutboxDispatch({
      ownerToken: 'worker-1',
      leaseDurationMs: 30000,
    });
    const worker2Claim = reliableAdapter.claimOutboxDispatch({
      ownerToken: 'worker-2',
      leaseDurationMs: 30000,
    });

    const [res1, res2] = await Promise.all([worker1Claim, worker2Claim]);
    const claimedCount = res1.length + res2.length;
    expect(claimedCount).toBe(1);

    const winner = res1.length > 0 ? res1[0] : res2[0];
    expect(winner.claimed).toBe(true);
    expect(winner.receipt.status).toBe('running');
    expect(winner.receipt.lease).not.toBeNull();
    expect(winner.receipt.attempt).toBe(1);
  });

  it('4. Crash recovery: expired lease is claimed by another worker', async () => {
    const opId = randomUUID();
    const notificationId = 'notif_crash';
    await seedNotification(notificationId);
    const occurrenceKey = `${notificationId}:${NotificationChannelType.InApp}`;
    const idempotencyKey = buildIdempotencyKeyString({
      identityId,
      source: 'notification',
      occurrenceKey,
    });

    await reliableAdapter.dispatchOutbox(
      {
        operationId: opId,
        identityId,
        source: 'notification',
        occurrenceKey,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'Crash Test', notificationId }),
        idempotencyKey,
      },
      { notificationId },
    );

    // Worker 1 claims with short lease (1ms)
    const claim1 = await reliableAdapter.claimOutboxDispatch({
      ownerToken: 'worker-1',
      leaseDurationMs: 1,
    });
    expect(claim1).toHaveLength(1);
    expect(claim1[0].receipt.lease?.fencingToken).toBe(1);

    // Wait for lease to expire
    await new Promise((r) => setTimeout(r, 10));

    // Worker 2 claims after expiration
    const claim2 = await reliableAdapter.claimOutboxDispatch({
      ownerToken: 'worker-2',
      leaseDurationMs: 30000,
    });

    expect(claim2).toHaveLength(1);
    expect(claim2[0].claimed).toBe(true);
    expect(claim2[0].receipt.lease?.ownerToken).toBe('worker-2');
    expect(claim2[0].receipt.lease?.fencingToken).toBe(2);
    expect(claim2[0].receipt.attempt).toBe(2);
  });

  it('5. Dead-letter query & replay cycle works end-to-end', async () => {
    const opId = randomUUID();
    const notificationId = 'notif_dl';
    await seedNotification(notificationId);
    const occurrenceKey = `${notificationId}:${NotificationChannelType.InApp}`;
    const idempotencyKey = buildIdempotencyKeyString({
      identityId,
      source: 'notification',
      occurrenceKey,
    });

    const dispatchReceipt = await reliableAdapter.dispatchOutbox(
      {
        operationId: opId,
        identityId,
        source: 'notification',
        occurrenceKey,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'Dead Letter Test', notificationId }),
        idempotencyKey,
      },
      { notificationId },
    );

    // Mark as dead_letter directly
    const deadReceipt: BusinessOperationReceipt = {
      ...dispatchReceipt,
      status: 'dead_letter',
      attempt: 3,
      deadLetterAt: new Date().toISOString(),
      lastError: 'Max retries exceeded',
      finishedAt: null,
      updatedAt: new Date().toISOString(),
    };

    await reliableAdapter.recordDeliveryReceipt(deadReceipt);

    // Query dead letters
    const deadLetters = await reliableAdapter.queryDeadLetters(identityId);
    expect(deadLetters).toHaveLength(1);
    expect(deadLetters[0].operationId).toBe(opId);
    expect(deadLetters[0].status).toBe('dead_letter');

    // Replay dead letter
    const replayed = await reliableAdapter.replayDeadLetter({
      identityId,
      operationId: opId,
    });

    expect(replayed.status).toBe('retryable');
    expect(replayed.deadLetterAt).toBeNull();

    // After replay, dead letter list for identity is empty
    const deadLettersAfter = await reliableAdapter.queryDeadLetters(identityId);
    expect(deadLettersAfter).toHaveLength(0);
  });

  it('6. CreateNotificationUseCase writes aggregate, channels, and outbox in same transaction', async () => {
    const useCase = new CreateNotificationUseCase(
      notificationRepo,
      templateRepo,
      preferenceRepo,
      async () => false,
    );

    let deliveredCount = 0;
    const mockDeliverer = {
      async deliver() {
        deliveredCount++;
      },
    };

    const runtime = createNotificationRuntimeContribution({
      environment: 'test',
      repository: notificationRepo,
      reliableAdapter,
      deliverer: mockDeliverer,
    });

    const res = await useCase.execute({
      identityId,
      title: 'Tx Test',
      content: 'Testing atomic transaction',
      type: NotificationType.Info,
      category: NotificationCategory.System,
      channels: [NotificationChannelType.InApp, NotificationChannelType.Push],
    });

    if (!res.ok) console.error('CreateNotificationUseCase failed:', res.error);
    expect(res.ok).toBe(true);
    const clientDTO = res.data;

    // Verify Notification and Channels exist in DB
    const notifInDb = await notificationRepo.findByIdForIdentity(identityId, clientDTO.id);
    expect(notifInDb).not.toBeNull();
    expect(notifInDb?.notificationChannels).toHaveLength(2);

    // Verify Outbox rows were written in same transaction
    const outboxes = await prisma.notificationDispatchOutbox.findMany({
      where: { identityId, notificationId: clientDTO.id },
    });
    expect(outboxes).toHaveLength(2);
    expect(outboxes.map((o) => o.channel).sort()).toEqual(['InApp', 'Push']);

    // Worker tick claims outbox dispatches and delivers them
    await runtime.tick();

    expect(deliveredCount).toBe(2);
    const metrics = runtime.getMetrics();
    expect(metrics.dispatchedTotal).toBe(2);
    expect(metrics.deliveredTotal).toBe(2);

    // Verify outbox status in DB updated to succeeded
    const updatedOutboxes = await prisma.notificationDispatchOutbox.findMany({
      where: { identityId, notificationId: clientDTO.id },
    });
    expect(updatedOutboxes.every((o) => o.status === 'succeeded')).toBe(true);
  });

  it('7. Stale owner completion write fails fencing condition and does not overwrite preempting owner state', async () => {
    const opId = randomUUID();
    const notificationId = 'notif_stale';
    await seedNotification(notificationId);
    const occurrenceKey = `${notificationId}:${NotificationChannelType.InApp}`;
    const idempotencyKey = buildIdempotencyKeyString({
      identityId,
      source: 'notification',
      occurrenceKey,
    });

    const initialReceipt = await reliableAdapter.dispatchOutbox(
      {
        operationId: opId,
        identityId,
        source: 'notification',
        occurrenceKey,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'Stale Owner Test', notificationId }),
        idempotencyKey,
      },
      { notificationId },
    );

    // Worker 1 claims with short lease (1ms)
    const claim1 = await reliableAdapter.claimOutboxDispatch({
      ownerToken: 'worker-1',
      leaseDurationMs: 1,
    });
    expect(claim1[0].receipt.lease?.fencingToken).toBe(1);

    // Wait for lease to expire
    await new Promise((r) => setTimeout(r, 10));

    // Worker 2 preempts and claims (fencingToken 2)
    const claim2 = await reliableAdapter.claimOutboxDispatch({
      ownerToken: 'worker-2',
      leaseDurationMs: 30000,
    });
    expect(claim2[0].receipt.lease?.fencingToken).toBe(2);

    // Worker 1 attempts to record completion with stale claimContext
    const staleTerminalReceipt = {
      ...initialReceipt,
      status: 'succeeded' as const,
      lease: null,
      finishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const recordResult = await reliableAdapter.recordDeliveryReceipt(staleTerminalReceipt, {
      ownerToken: 'worker-1',
      fencingToken: 1,
    });

    // Returned receipt should reflect active DB state (running under worker-2, fencingToken 2)
    expect(recordResult.status).toBe('running');
    expect(recordResult.lease?.ownerToken).toBe('worker-2');
    expect(recordResult.lease?.fencingToken).toBe(2);

    // DB row status must still be running under worker-2, not succeeded under worker-1
    const dbRow = await prisma.notificationDispatchOutbox.findUniqueOrThrow({
      where: { id: opId },
    });
    expect(dbRow.status).toBe('running');
    expect(dbRow.ownerToken).toBe('worker-2');
    expect(dbRow.fencingToken).toBe(2);
  });

  it('8. Authorized Application/API entrances for dead-letter query & replay', async () => {
    const { createNotificationPrismaModule } = await import('../../../prisma');
    const moduleInstance = createNotificationPrismaModule(prisma, {
      closureChecker: async () => false,
    });

    const opId = randomUUID();
    const notificationId = 'notif_api_dl';
    await seedNotification(notificationId);
    const occurrenceKey = `${notificationId}:${NotificationChannelType.InApp}`;
    const idempotencyKey = buildIdempotencyKeyString({
      identityId,
      source: 'notification',
      occurrenceKey,
    });

    const dispatchReceipt = await reliableAdapter.dispatchOutbox(
      {
        operationId: opId,
        identityId,
        source: 'notification',
        occurrenceKey,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'API Dead Letter', notificationId }),
        idempotencyKey,
      },
      { notificationId },
    );

    await reliableAdapter.recordDeliveryReceipt({
      ...dispatchReceipt,
      status: 'dead_letter',
      attempt: 3,
      lastError: 'Max retries exceeded',
      deadLetterAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Query via module API
    const dlResult = await moduleInstance.api.queryDeadLetters(identityId);
    expect(dlResult.ok).toBe(true);
    const dlList = dlResult.ok ? (dlResult.data as any[]) : [];
    expect(dlList).toHaveLength(1);
    expect(dlList[0].operationId).toBe(opId);

    // Replay via module API
    const replayResult = await moduleInstance.api.replayDeadLetter(opId, identityId);
    expect(replayResult.ok).toBe(true);
    const replayedData = replayResult.ok ? (replayResult.data as any) : null;
    expect(replayedData.status).toBe('retryable');

    moduleInstance.dispose();
  });

  it('9. Delivery receipts timeline query for disconnect recovery', async () => {
    const { createNotificationPrismaModule } = await import('../../../prisma');
    const moduleInstance = createNotificationPrismaModule(prisma, {
      closureChecker: async () => false,
    });

    const opId = randomUUID();
    const notificationId = 'notif_timeline';
    await seedNotification(notificationId);
    const occurrenceKey = `${notificationId}:${NotificationChannelType.InApp}`;
    const idempotencyKey = buildIdempotencyKeyString({
      identityId,
      source: 'notification',
      occurrenceKey,
    });

    await reliableAdapter.dispatchOutbox(
      {
        operationId: opId,
        identityId,
        source: 'notification',
        occurrenceKey,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'Timeline', notificationId }),
        idempotencyKey,
      },
      { notificationId },
    );

    const receiptsRes = await moduleInstance.api.getDeliveryReceipts(identityId, { limit: 10 });
    expect(receiptsRes.ok).toBe(true);
    const receipts = receiptsRes.ok ? (receiptsRes.data as any[]) : [];
    expect(receipts.length).toBeGreaterThanOrEqual(1);
    expect(receipts.some((r) => r.operationId === opId)).toBe(true);

    moduleInstance.dispose();
  });

  it('10. Concurrent worker competition prevents double sending and enforces atomic claim', async () => {
    let deliverCount = 0;
    const mockDeliverer = {
      async deliver() {
        deliverCount++;
        await new Promise((r) => setTimeout(r, 20));
      },
    };

    const worker1 = createNotificationRuntimeContribution({
      environment: 'test',
      ownerToken: 'worker-1',
      repository: notificationRepo,
      reliableAdapter,
      deliverer: mockDeliverer,
    });

    const worker2 = createNotificationRuntimeContribution({
      environment: 'test',
      ownerToken: 'worker-2',
      repository: notificationRepo,
      reliableAdapter,
      deliverer: mockDeliverer,
    });

    const opId = randomUUID();
    const notificationId = 'notif_concurrent_race';
    await seedNotification(notificationId);
    const occurrenceKey = `${notificationId}:${NotificationChannelType.InApp}`;
    const idempotencyKey = buildIdempotencyKeyString({
      identityId,
      source: 'notification',
      occurrenceKey,
    });

    await reliableAdapter.dispatchOutbox(
      {
        operationId: opId,
        identityId,
        source: 'notification',
        occurrenceKey,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'Concurrent Race Test', notificationId }),
        idempotencyKey,
      },
      { notificationId },
    );

    // Simulate simultaneous worker execution competition
    await Promise.all([worker1.tick(), worker2.tick()]);

    expect(deliverCount).toBe(1);

    const receipts = await reliableAdapter.queryReceipts(identityId);
    const receipt = receipts.find((r) => r.operationId === opId);
    expect(receipt).toBeDefined();
    expect(receipt?.status).toBe('succeeded');
  });

  it('11. Real HTTP SSE stream: disconnect window events are delivered via Last-Event-ID catch-up', async () => {
    const express = (await import('express')).default;
    const http = await import('http');
    const { createNotificationPrismaModule } = await import('../../../prisma');
    const { registerNotificationRoutes } = await import('../../../../../api/routes');

    const app = express();
    app.use(express.json());

    // Custom runtime so the test can deterministically drive durable completion
    // instead of waiting for the poll interval.
    const mockDeliverer = {
      async deliver() {},
    };
    const runtime = createNotificationRuntimeContribution({
      environment: 'test',
      repository: notificationRepo,
      reliableAdapter,
      deliverer: mockDeliverer,
    });
    const moduleInstance = createNotificationPrismaModule(prisma, {
      runtimeContributions: [runtime],
      closureChecker: async () => false,
    });

    const mockAuth = (_req: any, _res: any, next: any) => {
      _req.identityId = identityId;
      _req.user = { id: identityId };
      next();
    };

    const router = registerNotificationRoutes(moduleInstance.api, {
      auth: mockAuth,
      requireRole: () => mockAuth,
    });

    app.use('/api/v1/notifications', router);

    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as any;
    const port = address.port;
    const sseUrl = `http://127.0.0.1:${port}/api/v1/notifications/sse`;

    // 1. Initial SSE Connection (no cursor → no catch-up yet)
    const req1 = http.get(sseUrl, { headers: { Authorization: 'Bearer test' } });
    let event1Timestamp: string | null = null;

    const dataPromise1 = new Promise<void>((resolve) => {
      req1.on('response', (res) => {
        res.on('data', (chunk) => {
          const str = chunk.toString();
          const idLine = str.split('\n').find((l: string) => l.startsWith('id:'));
          if (idLine) {
            event1Timestamp = idLine.substring(3).trim();
            resolve();
          }
        });
      });
    });

    // 2. Server writes event 1 outbox and completes it → live broadcast on connection 1
    const notifId1 = 'notif_sse_real_1';
    const opId1 = randomUUID();
    await seedNotification(notifId1);
    await reliableAdapter.dispatchOutbox(
      {
        operationId: opId1,
        identityId,
        source: 'notification',
        occurrenceKey: `${notifId1}:${NotificationChannelType.InApp}`,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'SSE Live Event 1', notificationId: notifId1 }),
        idempotencyKey: buildIdempotencyKeyString({ identityId, source: 'notification', occurrenceKey: `${notifId1}:${NotificationChannelType.InApp}` }),
      },
      { notificationId: notifId1 },
    );
    await runtime.tick();

    await dataPromise1;
    expect(event1Timestamp).not.toBeNull();

    // 3. Disconnect Connection 1
    req1.destroy();

    // 4. During the disconnection window: server writes event 2 outbox AND completes it.
    //    The live broadcast has no subscriber, so only the durable succeeded receipt remains.
    await new Promise((r) => setTimeout(r, 20));
    const notifId2 = 'notif_sse_real_2';
    const opId2 = randomUUID();
    await seedNotification(notifId2);
    await reliableAdapter.dispatchOutbox(
      {
        operationId: opId2,
        identityId,
        source: 'notification',
        occurrenceKey: `${notifId2}:${NotificationChannelType.InApp}`,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'SSE Reconnection Event 2', notificationId: notifId2 }),
        idempotencyKey: buildIdempotencyKeyString({ identityId, source: 'notification', occurrenceKey: `${notifId2}:${NotificationChannelType.InApp}` }),
      },
      { notificationId: notifId2 },
    );
    await runtime.tick();

    // Event 2 receipt must already be durable (succeeded) BEFORE reconnecting.
    const receiptsBeforeReconnect = await reliableAdapter.queryReceipts(identityId);
    const receipt2BeforeReconnect = receiptsBeforeReconnect.find((r) => r.operationId === opId2);
    expect(receipt2BeforeReconnect).toBeDefined();
    expect(receipt2BeforeReconnect?.status).toBe('succeeded');

    // 5. Reconnect Connection 2 with Last-Event-ID header — catch-up must deliver event 2
    //    from the durable succeeded receipt (its live broadcast already happened while disconnected).
    const receivedChunks: string[] = [];
    const req2 = http.get(sseUrl, {
      headers: {
        Authorization: 'Bearer test',
        'Last-Event-ID': event1Timestamp!,
      },
    });

    const dataPromise2 = new Promise<void>((resolve) => {
      req2.on('response', (res) => {
        res.on('data', (chunk) => {
          const str = chunk.toString();
          receivedChunks.push(str);
          if (str.includes(opId2)) {
            resolve();
          }
        });
      });
    });

    await dataPromise2;
    const event2Payload = receivedChunks.find((c) => c.includes(opId2)) ?? '';
    // The catch-up payload is the succeeded receipt (durable state), not a live dispatch event.
    expect(event2Payload).toContain(opId2);
    expect(event2Payload).toContain('succeeded');

    req2.destroy();
    moduleInstance.dispose();
    await new Promise((resolve) => server.close(resolve as any));
  });

  it('12. Cross-module W1 Reminder Outbox intent is consumed, FK/id created correctly and persisted', async () => {
    // eslint-disable-next-line @nx/enforce-module-boundaries
    const { PrismaReminderWriteTransactionRunner } = await import(
      '../../../../../../../reminder/src/server/infrastructure/adapters/prisma/prisma-reminder-write-transaction-runner'
    );
    // eslint-disable-next-line @nx/enforce-module-boundaries
    const { ReminderTemplate } = await import(
      '../../../../../../../reminder/src/server/domain/aggregates/reminder-template'
    );

    // W1 cron trigger intent (0 9 * * *) is expressed via FixedTime trigger in the current contract
    const template = ReminderTemplate.create({
      identityId: identityId as any,
      title: 'Cross Module Reminder',
      description: 'Testing W1 intent consumption',
      type: ReminderType.Recurring,
      trigger: {
        type: 'FixedTime',
        fixedTime: { time: '09:00', timezone: 'UTC' },
        interval: null,
      },
      activeTime: { activatedAt: Date.now() - 60_000 },
      notificationConfig: {
        channels: ['InApp'],
        title: 'Cross Module Reminder',
        body: 'Testing W1 intent consumption',
        sound: { enabled: true, soundName: null },
        vibration: { enabled: true, pattern: null },
        actions: null,
      },
    });

    const templateId = template.id as string;
    // Real W1 occurrenceKey: `${templateId}:${triggerTimeIso}` — its prefix is the
    // reminder template id, NOT a pre-existing Notification id. No masking seed is allowed.
    const triggerTime = Date.now();
    const triggerTimeIso = new Date(triggerTime).toISOString();
    const occurrenceKey = `${templateId}:${triggerTimeIso}`;
    const idempotencyKey = buildIdempotencyKeyString({
      identityId,
      source: 'reminder',
      occurrenceKey,
    });
    const ownerToken = 'runner-1';
    const fencingToken = 1;
    const occurrenceId = randomUUID();

    const tplDto = template.toServerDTO();
    await prisma.reminderTemplate.create({
      data: {
        id: templateId,
        identityId,
        name: tplDto.name,
        description: tplDto.description,
        type: tplDto.type,
        selfEnabled: tplDto.selfEnabled,
        status: tplDto.status,
        importanceLevel: tplDto.importanceLevel,
        tags: JSON.stringify(tplDto.tags),
        color: tplDto.color,
        icon: tplDto.icon,
        trigger: JSON.stringify(tplDto.trigger),
        activeTime: JSON.stringify(tplDto.activeTime),
        activeHours: tplDto.activeHours ? JSON.stringify(tplDto.activeHours) : null,
        notificationConfig: JSON.stringify(tplDto.notificationConfig),
        nextTriggerAt: tplDto.nextTriggerAt != null ? new Date(tplDto.nextTriggerAt) : null,
        stats: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.reminderOccurrence.create({
      data: {
        id: occurrenceId,
        templateId,
        identityId,
        source: 'reminder',
        occurrenceKey,
        idempotencyKey,
        status: 'running',
        attempt: 1,
        ownerToken,
        claimId: randomUUID(),
        fencingToken,
        leaseExpiresAt: new Date(Date.now() + 30000),
        correlationId: occurrenceId,
        causationId: occurrenceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const runner = new PrismaReminderWriteTransactionRunner(prisma);

    await runner.executeClaimedOccurrenceTransaction({
      template,
      occurrence: {
        id: occurrenceId,
        identityId,
        templateId,
        occurrenceKey,
        idempotencyKey,
        fencingToken,
        ownerToken,
      },
      isEnabled: true,
      triggerTime,
    });

    // Verify OutboxMessage pending
    const pendingOutbox = await prisma.outboxMessage.findFirst({
      where: { identityId, messageType: 'notification.dispatch', status: 'pending' },
    });
    expect(pendingOutbox).not.toBeNull();

    // Run Notification worker tick
    const mockDeliverer = {
      async deliver() {},
    };

    const runtime = createNotificationRuntimeContribution({
      environment: 'test',
      repository: notificationRepo,
      reliableAdapter,
      deliverer: mockDeliverer,
    });

    await runtime.tick();

    // Verify OutboxMessage is succeeded
    const updatedOutbox = await prisma.outboxMessage.findUnique({
      where: { id: pendingOutbox!.id },
    });
    expect(updatedOutbox?.status).toBe('succeeded');
    expect(updatedOutbox?.dispatchedAt).not.toBeNull();

    // Verify Notification aggregate is persisted in DB
    const notifs = await notificationRepo.findByIdentityId(identityId);
    const persisted = notifs.find((n) => n.title === 'Cross Module Reminder');
    expect(persisted).toBeDefined();
    const persistedNotificationId = String(persisted!.id);

    // Verify NotificationDispatchOutbox row exists and its FK points at the real
    // persisted Notification id (NOT the W1 occurrenceKey prefix = template id),
    // proving the consumer created correct FK/id itself.
    const outboxes = await prisma.notificationDispatchOutbox.findMany({
      where: { identityId, source: 'notification' },
    });
    expect(outboxes.length).toBeGreaterThanOrEqual(1);
    const dispatchOutbox = outboxes.find((o) => o.notificationId === persistedNotificationId);
    expect(dispatchOutbox).toBeDefined();
    expect(dispatchOutbox?.status).toBe('succeeded');
    expect(dispatchOutbox?.notificationId).not.toBe(templateId);
  });

  it('13. Fault Injection 1: Shared claim crash -> lease expires -> reclaimed -> deliverer invoked exactly once', async () => {
    let delivererCount = 0;
    const mockDeliverer = {
      async deliver() {
        delivererCount++;
      },
    };

    const worker2 = createNotificationRuntimeContribution({
      environment: 'test',
      ownerToken: 'worker-crash-2',
      repository: notificationRepo,
      reliableAdapter,
      deliverer: mockDeliverer,
    });

    const sharedId = randomUUID();
    const notificationId = 'notif_fault_shared_crash';

    // Seed cross-module W1 OutboxMessage
    await prisma.outboxMessage.create({
      data: {
        id: sharedId,
        correlationId: sharedId,
        messageType: 'notification.dispatch',
        payloadJson: JSON.stringify({
          notificationId,
          identityId,
          title: 'Shared Fault Crash',
          content: 'Shared Crash Content',
          channel: 'InApp',
        }),
        status: 'pending',
        identityId,
        idempotencyKey: buildIdempotencyKeyString({
          identityId,
          source: 'notification',
          occurrenceKey: `reminder:${sharedId}`,
        }),
      },
    });

    // Worker 1 claims shared outbox intent with a 1ms short lease
    const claims = await reliableAdapter.claimSharedOutboxIntents({
      ownerToken: 'worker-crash-1',
      leaseDurationMs: 1,
    });
    expect(claims).toHaveLength(1);
    expect(claims[0].ownerToken).toBe('worker-crash-1');

    // Worker 1 crashes before calling tick/deliverer/completion update.
    // Wait for worker 1 lease to expire.
    await new Promise((r) => setTimeout(r, 15));

    // Worker 2 reclaims the expired lease and runs tick
    await worker2.tick();

    // Deliverer call count must be exactly 1
    expect(delivererCount).toBe(1);

    const sharedOutbox = await prisma.outboxMessage.findUnique({ where: { id: sharedId } });
    expect(sharedOutbox?.status).toBe('succeeded');
  });

  it('14. Fault Injection 2: Side effect succeeded but crash before receipt commit -> reclaimed -> does not re-invoke deliverer', async () => {
    let delivererCount = 0;
    const realInAppDeliverer = new RealInAppChannelDeliverer(notificationRepo);
    const countingDeliverer = {
      async deliver(notif: any, ch: any, ctx: any) {
        delivererCount++;
        await realInAppDeliverer.deliver(notif, ch, ctx);
      },
    };

    const worker2 = createNotificationRuntimeContribution({
      environment: 'test',
      ownerToken: 'worker-sideeffect-2',
      repository: notificationRepo,
      reliableAdapter,
      deliverer: countingDeliverer,
    });

    const notifId = 'notif_fault_sideeffect_crash';
    await seedNotification(notifId);

    const occurrenceKey = `${notifId}:${NotificationChannelType.InApp}`;
    const idempotencyKey = buildIdempotencyKeyString({
      identityId,
      source: 'notification',
      occurrenceKey,
    });
    const opId = randomUUID();

    await reliableAdapter.dispatchOutbox(
      {
        operationId: opId,
        identityId,
        source: 'notification',
        occurrenceKey,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'Side Effect Crash', notificationId: notifId }),
        idempotencyKey,
      },
      { notificationId: notifId },
    );

    // Worker 1 claims with 1ms lease
    const claims = await reliableAdapter.claimOutboxDispatch({
      ownerToken: 'worker-sideeffect-1',
      leaseDurationMs: 1,
    });
    expect(claims).toHaveLength(1);

    // Worker 1 executes deliverer (side effect succeeds, channel response updated & saved to DB)
    const notifObj = await notificationRepo.findByIdForIdentity(identityId, notifId);
    const ch = notifObj!.notificationChannels!.find((c) => c.channelType === 'InApp')!;
    await countingDeliverer.deliver(notifObj!, ch, { deliveryId: opId, idempotencyKey, identityId });
    expect(delivererCount).toBe(1);

    // Worker 1 crashes BEFORE calling recordDeliveryReceipt.
    // Wait for lease to expire.
    await new Promise((r) => setTimeout(r, 10));

    // Worker 2 claims expired outbox item and ticks
    await worker2.tick();

    // Deliverer call count must STILL be 1 (worker 2 recognized side effect was completed and skipped deliverer)
    expect(delivererCount).toBe(1);

    const receipt = (await reliableAdapter.queryReceipts(identityId)).find((r) => r.operationId === opId);
    expect(receipt?.status).toBe('succeeded');
  });

  it('15. Fault Injection 3: Stale owner completion write rejected when new owner already succeeded -> returns conflict/original receipt without duplicate count', async () => {
    const opId = randomUUID();
    const notificationId = 'notif_fault_stale_fencing';
    await seedNotification(notificationId);
    const occurrenceKey = `${notificationId}:${NotificationChannelType.InApp}`;
    const idempotencyKey = buildIdempotencyKeyString({
      identityId,
      source: 'notification',
      occurrenceKey,
    });

    const initialReceipt = await reliableAdapter.dispatchOutbox(
      {
        operationId: opId,
        identityId,
        source: 'notification',
        occurrenceKey,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'Stale Owner Fencing Test', notificationId }),
        idempotencyKey,
      },
      { notificationId },
    );

    // Worker 1 claims with 1ms lease (fencingToken 1)
    const claim1 = await reliableAdapter.claimOutboxDispatch({
      ownerToken: 'worker-stale-1',
      leaseDurationMs: 1,
    });
    expect(claim1[0].receipt.lease?.fencingToken).toBe(1);

    // Wait for lease to expire
    await new Promise((r) => setTimeout(r, 10));

    // Worker 2 preempts and completes outbox item to succeeded (fencingToken 2)
    const claim2 = await reliableAdapter.claimOutboxDispatch({
      ownerToken: 'worker-new-2',
      leaseDurationMs: 30000,
    });
    expect(claim2[0].receipt.lease?.fencingToken).toBe(2);

    const worker2SucceededReceipt = await reliableAdapter.recordDeliveryReceipt(
      {
        ...claim2[0].receipt,
        status: 'succeeded',
        lease: null,
        finishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { ownerToken: 'worker-new-2', fencingToken: 2 },
    );
    expect(worker2SucceededReceipt.status).toBe('succeeded');

    // Stale Worker 1 attempts to record completion with stale claimContext (ownerToken: worker-stale-1, fencingToken: 1)
    const staleCompletionReceipt = {
      ...initialReceipt,
      status: 'succeeded' as const,
      lease: null,
      finishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const staleResult = await reliableAdapter.recordDeliveryReceipt(staleCompletionReceipt, {
      ownerToken: 'worker-stale-1',
      fencingToken: 1,
    });

    // Returned receipt must be the existing succeeded receipt from Worker 2, and applied flag must be false
    expect(staleResult.status).toBe('succeeded');
    expect((staleResult as any).applied).toBe(false);

    // Outbox DB record must remain untouched under worker 2's completion
    const dbRow = await prisma.notificationDispatchOutbox.findUniqueOrThrow({
      where: { id: opId },
    });
    expect(dbRow.status).toBe('succeeded');
  });

  it('16. Fault Injection 4: SSE catch-up delivers incremental durable events (delivered without duplicate)', async () => {
    const express = (await import('express')).default;
    const http = await import('http');
    const { createNotificationPrismaModule } = await import('../../../prisma');
    const { registerNotificationRoutes } = await import('../../../../../api/routes');

    const app = express();
    app.use(express.json());

    const mockDeliverer = { async deliver() {} };
    const runtime = createNotificationRuntimeContribution({
      environment: 'test',
      repository: notificationRepo,
      reliableAdapter,
      deliverer: mockDeliverer,
    });
    const moduleInstance = createNotificationPrismaModule(prisma, {
      runtimeContributions: [runtime],
      closureChecker: async () => false,
    });

    const mockAuth = (_req: any, _res: any, next: any) => {
      _req.identityId = identityId;
      _req.user = { id: identityId };
      next();
    };

    const router = registerNotificationRoutes(moduleInstance.api, {
      auth: mockAuth,
      requireRole: () => mockAuth,
    });

    app.use('/api/v1/notifications', router);

    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;

    // Seed Event 1 (durable succeeded receipt)
    const notifId1 = 'notif_race_1';
    const opId1 = randomUUID();
    await seedNotification(notifId1);
    await reliableAdapter.dispatchOutbox(
      {
        operationId: opId1,
        identityId,
        source: 'notification',
        occurrenceKey: `${notifId1}:${NotificationChannelType.InApp}`,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'Race Event 1', notificationId: notifId1 }),
        idempotencyKey: buildIdempotencyKeyString({ identityId, source: 'notification', occurrenceKey: `${notifId1}:${NotificationChannelType.InApp}` }),
      },
      { notificationId: notifId1 },
    );
    await runtime.tick();

    // Connect SSE client with Last-Event-ID catch-up
    const receipts = await reliableAdapter.queryReceipts(identityId);
    const r1 = receipts.find((r) => r.operationId === opId1)!;
    const lastCursor = `${r1.updatedAt}|${r1.operationId}`;

    // Seed Event 2 (durable succeeded receipt) while connection is established
    const notifId2 = 'notif_race_2';
    const opId2 = randomUUID();
    await seedNotification(notifId2);
    await reliableAdapter.dispatchOutbox(
      {
        operationId: opId2,
        identityId,
        source: 'notification',
        occurrenceKey: `${notifId2}:${NotificationChannelType.InApp}`,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'Race Event 2', notificationId: notifId2 }),
        idempotencyKey: buildIdempotencyKeyString({ identityId, source: 'notification', occurrenceKey: `${notifId2}:${NotificationChannelType.InApp}` }),
      },
      { notificationId: notifId2 },
    );
    await runtime.tick();

    const receivedChunks: string[] = [];
    let sseReq: any = null;
    await new Promise<void>((resolve) => {
      sseReq = http.get(
        `http://127.0.0.1:${port}/api/v1/notifications/sse`,
        {
          headers: {
            Authorization: 'Bearer test',
            'Last-Event-ID': lastCursor,
          },
        },
        (res) => {
          res.on('data', (chunk) => {
            const str = chunk.toString();
            receivedChunks.push(str);
            if (receivedChunks.join('').includes(opId2)) {
              resolve();
            }
          });
        },
      );
      sseReq.on('error', resolve);
    });

    const fullOutput = receivedChunks.join('');
    expect(fullOutput).toContain(opId2);
    const dataMessageCount = fullOutput
      .split('\n\n')
      .filter((block) => block.includes('data:') && block.includes(opId2)).length;
    expect(dataMessageCount).toBe(1);

    if (sseReq) sseReq.destroy();
    moduleInstance.dispose();
    await new Promise((resolve) => server.close(resolve as any));
  });

  it('17. Fault Injection 5: Identical timestamps + 101+ backlog multi-page catch-up delivers all events without loss', async () => {
    const express = (await import('express')).default;
    const http = await import('http');
    const { createNotificationPrismaModule } = await import('../../../prisma');
    const { registerNotificationRoutes } = await import('../../../../../api/routes');

    const app = express();
    app.use(express.json());

    const moduleInstance = createNotificationPrismaModule(prisma, {
      closureChecker: async () => false,
    });
    const mockAuth = (_req: any, _res: any, next: any) => {
      _req.identityId = identityId;
      _req.user = { id: identityId };
      next();
    };

    const router = registerNotificationRoutes(moduleInstance.api, {
      auth: mockAuth,
      requireRole: () => mockAuth,
    });

    app.use('/api/v1/notifications', router);

    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;

    let req: any;

    try {
      // Create 105 succeeded outbox items with fixed timestamp to test same-timestamp + multi-page (>100) catchup
      const sharedTime = new Date();
      const createdOpIds: string[] = [];
      const notifData: any[] = [];
      const outboxData: any[] = [];

      for (let i = 0; i < 105; i++) {
        const opId = randomUUID();
        const notifId = `notif_batch_${i}`;
        createdOpIds.push(opId);
        const occurrenceKey = `${notifId}:${NotificationChannelType.InApp}`;
        const idempotencyKey = buildIdempotencyKeyString({
          identityId,
          source: 'notification',
          occurrenceKey,
        });

        notifData.push({
          id: notifId,
          identityId,
          title: 'Test Notification',
          content: 'Content',
          type: 'Info',
          category: 'System',
          importance: 'Normal',
          urgency: 'Normal',
          status: 'Pending',
          version: 1,
          createdAt: sharedTime,
          updatedAt: sharedTime,
        });

        outboxData.push({
          id: opId,
          identityId,
          source: 'notification',
          occurrenceKey,
          channel: 'InApp',
          notificationId: notifId,
          status: 'succeeded',
          payloadJson: JSON.stringify({ title: `Batch Notification ${i}`, notificationId: notifId }),
          idempotencyKey,
          attempt: 1,
          createdAt: sharedTime,
          updatedAt: sharedTime,
          finishedAt: sharedTime,
        });
      }

      await prisma.notification.createMany({ data: notifData });
      await prisma.notificationDispatchOutbox.createMany({ data: outboxData });

      const receivedEvents: string[] = [];
      const initialCursor = new Date(0).toISOString();

      await new Promise<void>((resolve) => {
        req = http.get(`http://127.0.0.1:${port}/api/v1/notifications/sse?lastCursor=${initialCursor}`, {
          headers: { Authorization: 'Bearer test' },
        });

        let buffer = '';
        req.on('response', (res: any) => {
          res.on('data', (chunk: any) => {
            buffer += chunk.toString();
            const blocks = buffer.split('\n\n');
            buffer = blocks.pop() ?? '';
            for (const block of blocks) {
              if (block.includes('data:')) {
                receivedEvents.push(block);
              }
            }
            if (receivedEvents.length >= 105) {
              resolve();
            }
          });
        });
      });

      expect(receivedEvents.length).toBeGreaterThanOrEqual(105);
      for (const opId of createdOpIds) {
        expect(receivedEvents.some((e) => e.includes(opId))).toBe(true);
      }
    } finally {
      if (req) req.destroy();
      moduleInstance.dispose();
      await new Promise((resolve) => server.close(resolve as any));
    }
  }, 60000);

  it('18. Fault Injection 6: InApp deliverer repo save failure -> receipt fails/retries and no broadcast', async () => {
    let broadcastCount = 0;
    const mockSseAdapter = {
      broadcastDeliveryEvent() {
        broadcastCount++;
      },
    };

    const failingRepo = {
      ...notificationRepo,
      async save() {
        throw new Error('Database disk error simulation');
      },
    } as any;

    const failingDeliverer = new RealInAppChannelDeliverer(failingRepo);

    const runtime = createNotificationRuntimeContribution({
      environment: 'test',
      repository: notificationRepo,
      reliableAdapter,
      deliverer: failingDeliverer,
      sseAdapter: mockSseAdapter as any,
    });

    const notifId = 'notif_fault_save_fail';
    await seedNotification(notifId);
    const occurrenceKey = `${notifId}:${NotificationChannelType.InApp}`;
    const idempotencyKey = buildIdempotencyKeyString({
      identityId,
      source: 'notification',
      occurrenceKey,
    });
    const opId = randomUUID();

    await reliableAdapter.dispatchOutbox(
      {
        operationId: opId,
        identityId,
        source: 'notification',
        occurrenceKey,
        channel: NotificationChannelType.InApp,
        payloadJson: JSON.stringify({ title: 'Save Fail Test', notificationId: notifId }),
        idempotencyKey,
      },
      { notificationId: notifId },
    );

    // Run worker tick
    await runtime.tick();

    // Outbox receipt must NOT be succeeded (it failed during deliverer save)
    const receipt = (await reliableAdapter.queryReceipts(identityId)).find((r) => r.operationId === opId);
    expect(receipt?.status).not.toBe('succeeded');
    expect(receipt?.status).toBe('retryable');

    // SSE broadcast count must be 0 (no success broadcast)
    expect(broadcastCount).toBe(0);
  });

  it('19. Fault Injection 7: Shared outbox stale owner completion write returns conflict and does not overwrite new owner', async () => {
    const sharedId = randomUUID();
    const notificationId = 'notif_shared_stale_owner';

    await prisma.outboxMessage.create({
      data: {
        id: sharedId,
        correlationId: sharedId,
        messageType: 'notification.dispatch',
        payloadJson: JSON.stringify({
          notificationId,
          identityId,
          title: 'Stale Owner Shared',
          content: 'Stale Owner Shared Content',
          channel: 'InApp',
        }),
        status: 'pending',
        identityId,
        idempotencyKey: buildIdempotencyKeyString({
          identityId,
          source: 'notification',
          occurrenceKey: `reminder:${sharedId}`,
        }),
      },
    });

    // Worker 1 claims shared outbox intent with 1ms lease
    const claims1 = await reliableAdapter.claimSharedOutboxIntents({
      ownerToken: 'old-shared-owner',
      leaseDurationMs: 1,
    });
    expect(claims1).toHaveLength(1);
    const oldLeaseContext = {
      ownerToken: claims1[0].ownerToken!,
      claimId: claims1[0].claimId!,
      fencingToken: claims1[0].fencingToken!,
    };

    // Wait for old lease to expire
    await new Promise((r) => setTimeout(r, 15));

    // Worker 2 claims shared outbox intent
    const claims2 = await reliableAdapter.claimSharedOutboxIntents({
      ownerToken: 'new-shared-owner',
      leaseDurationMs: 30000,
    });
    expect(claims2).toHaveLength(1);
    expect(claims2[0].ownerToken).toBe('new-shared-owner');
    const newLeaseContext = {
      ownerToken: claims2[0].ownerToken!,
      claimId: claims2[0].claimId!,
      fencingToken: claims2[0].fencingToken!,
    };

    // Old owner attempts completion write
    const res1 = await reliableAdapter.updateSharedOutboxStatus(
      sharedId,
      'dead_letter',
      'Old owner error',
      null,
      oldLeaseContext,
    );
    expect(res1).toBe('conflict');

    // New owner completes write successfully
    const res2 = await reliableAdapter.updateSharedOutboxStatus(
      sharedId,
      'succeeded',
      null,
      null,
      newLeaseContext,
    );
    expect(res2).toBe('ok');

    const updated = await prisma.outboxMessage.findUnique({ where: { id: sharedId } });
    expect(updated?.status).toBe('succeeded');
    expect(updated?.lastError).toBeNull();
  });

  it('20. Dual runtime shared outbox in-flight completion conflict: only first runtime succeeds, status remains succeeded without duplicate side-effects', async () => {
    const sharedId = randomUUID();
    const notificationId = 'notif_dual_runtime_conflict';

    // Runtime A deliverer: records the call, signals it is in-flight, then
    // blocks inside tick() until the test releases it — a real in-flight
    // barrier between the claim and the completion write.
    let deliverCallsA = 0;
    let signalDeliverStarted!: () => void;
    const deliverStarted = new Promise<void>((resolve) => (signalDeliverStarted = resolve));
    let releaseDelivererA!: () => void;
    const deliverGate = new Promise<void>((resolve) => (releaseDelivererA = resolve));
    const delivererA: NotificationChannelDeliverer = {
      async deliver() {
        deliverCallsA++;
        signalDeliverStarted();
        await deliverGate;
      },
    };

    let deliverCallsB = 0;
    const delivererB: NotificationChannelDeliverer = {
      async deliver() {
        deliverCallsB++;
      },
    };

    const runtimeA = createNotificationRuntimeContribution({
      environment: 'test',
      repository: notificationRepo,
      reliableAdapter,
      deliverer: delivererA,
      ownerToken: 'runtime-1-owner',
      leaseDurationMs: 30000,
    });

    const runtimeB = createNotificationRuntimeContribution({
      environment: 'test',
      repository: notificationRepo,
      reliableAdapter,
      deliverer: delivererB,
      ownerToken: 'runtime-2-owner',
      leaseDurationMs: 30000,
    });

    // Seed one shared W1 `notification.dispatch` intent (pending, no lease).
    await prisma.outboxMessage.create({
      data: {
        id: sharedId,
        correlationId: sharedId,
        messageType: 'notification.dispatch',
        payloadJson: JSON.stringify({
          notificationId,
          identityId,
          title: 'Dual Runtime Conflict',
          content: 'Dual Runtime Content',
          channel: 'InApp',
        }),
        status: 'pending',
        identityId,
        idempotencyKey: buildIdempotencyKeyString({
          identityId,
          source: 'notification',
          occurrenceKey: `reminder:${sharedId}`,
        }),
      },
    });

    // Runtime A really ticks: claims the shared intent, creates the durable
    // dispatch outbox, claims it, and enters delivererA (now in-flight).
    const tickPromiseA = runtimeA.tick();
    await Promise.race([
      deliverStarted,
      tickPromiseA.then(() => {
        throw new Error('Runtime A completed its tick without reaching the deliverer barrier');
      }),
    ]);

    // While A is in-flight with valid leases, B really ticks: it must NOT
    // reclaim the shared intent nor the dispatch outbox (no duplicate claim).
    await runtimeB.tick();
    expect(deliverCallsB).toBe(0);
    const stillOwnedByA = await prisma.outboxMessage.findUnique({ where: { id: sharedId } });
    expect(stillOwnedByA?.ownerToken).toBe('runtime-1-owner');

    // Force A's leases (shared intent + durable dispatch outbox) to expire so
    // B can reclaim them, modelling A's lease window elapsing mid-flight.
    const past = new Date(Date.now() - 1000);
    await prisma.outboxMessage.update({
      where: { id: sharedId },
      data: { leaseExpiresAt: past, availableAt: past },
    });
    await prisma.notificationDispatchOutbox.update({
      where: { id: sharedId },
      data: { leaseExpiresAt: past },
    });

    // Runtime B really ticks again: reclaims both leases, delivers once, and
    // completes the shared intent to succeeded (fencingToken 2, attempt 2).
    await runtimeB.tick();
    expect(deliverCallsB).toBe(1);

    const dispatchAfterB = await prisma.notificationDispatchOutbox.findUniqueOrThrow({
      where: { id: sharedId },
    });
    expect(dispatchAfterB.status).toBe('succeeded');
    expect(dispatchAfterB.fencingToken).toBe(2);
    expect(dispatchAfterB.attempt).toBe(2);

    // Release A's deliverer: its completion write is now stale and must be
    // rejected (fencing conflict) instead of overwriting B's state.
    releaseDelivererA();
    await tickPromiseA;

    // Exactly one deliver per claim cycle: A delivered once, B delivered once.
    // A's stale completion must NOT have triggered any re-delivery or override.
    expect(deliverCallsA).toBe(1);
    expect(deliverCallsB).toBe(1);

    const sharedFinal = await prisma.outboxMessage.findUnique({ where: { id: sharedId } });
    expect(sharedFinal?.status).toBe('succeeded');
    expect(sharedFinal?.fencingToken).toBe(2);
    expect(sharedFinal?.ownerToken).toBeNull();
    expect(sharedFinal?.lastError).toBeNull();

    const dispatchFinal = await prisma.notificationDispatchOutbox.findUniqueOrThrow({
      where: { id: sharedId },
    });
    expect(dispatchFinal.status).toBe('succeeded');
    expect(dispatchFinal.fencingToken).toBe(2); // still B's claim fencing, not rolled back
    expect(dispatchFinal.attempt).toBe(2); // not rolled back to A's attempt 1
    expect(dispatchFinal.ownerToken).toBeNull();
    expect(dispatchFinal.lastError).toBeNull();

    // Metrics corroborate the rejection: A's stale completion was never
    // recorded as delivered, while B's completion was.
    expect(runtimeA.getMetrics().deliveredTotal).toBe(0);
    expect(runtimeB.getMetrics().deliveredTotal).toBeGreaterThanOrEqual(1);
  });
});
