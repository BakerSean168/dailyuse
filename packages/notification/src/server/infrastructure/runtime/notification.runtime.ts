import { createLogger } from '@memoflow/utils/logger';
import { ChannelStatus, NotificationChannelType as ChannelTypeEnum } from '@memoflow/contracts/notification';
import { Notification } from '../../domain/aggregates/notification';
import { NotificationChannel } from '../../domain/entities/notification-channel';
import { ChannelError } from '../../domain/value-objects/channel-error';
import type { INotificationRepository } from '../../domain/repositories/i-notification-repository';
import type { NotificationModuleRuntimeContribution } from '../notification.module';
import {
  assertProductionCapabilityOrFailFast,
  type BusinessOperationReceipt,
  type CapabilityRequirementContract,
  type CapabilityStatus,
} from '@memoflow/contracts/reliable-messaging';
import type { NotificationReliableOperationPrismaAdapter } from '../adapters/prisma/notification-reliable-operation-prisma.adapter';
import type { InMemoryNotificationReliableAdapter } from '../adapters/in-memory/in-memory-notification-reliable.adapter';
import type { PowerSyncNotificationReliableAdapter } from '../adapters/powersync/power-sync-notification-reliable.adapter';

export type NotificationReliableOperationAdapter =
  | NotificationReliableOperationPrismaAdapter
  | InMemoryNotificationReliableAdapter
  | PowerSyncNotificationReliableAdapter;
import { NotificationMetricsService, type NotificationMetricsSnapshot } from '../../domain/services/notification-metrics-service';
import { NotificationSseAdapter } from '../adapters/sse/notification-sse.adapter';
import { randomUUID } from 'crypto';

const logger = createLogger('NotificationRuntime');

export const NOTIFICATION_CHANNEL_POLL_INTERVAL_MS = 2_000;
/** 指数退避基数（毫秒）：delay = baseDelay * 2^attempts */
export const NOTIFICATION_CHANNEL_BACKOFF_BASE_MS = 5_000;
export const NOTIFICATION_CHANNEL_DEAD_LETTER_THRESHOLD = 3;

/**
 * Stable delivery context passed to every channel deliverer.
 *
 * `deliveryId` is the durable outbox operationId and `idempotencyKey` is the
 * canonical W0 key. Real adapters use these to deduplicate downstream side
 * effects across lease expiry / replay / stale in-flight owners.
 */
export interface NotificationDeliveryContext {
  readonly deliveryId: string;
  readonly idempotencyKey: string;
  readonly identityId: string;
}

export interface NotificationChannelDeliverer {
  /** 投递单个渠道；成功 resolve，失败 throw（worker 会标记 Failed 并安排重试）。 */
  deliver(
    notification: Notification,
    channel: NonNullable<Notification['notificationChannels']>[number],
    context: NotificationDeliveryContext,
  ): Promise<void>;
}



export interface ChannelCapabilitySpec {
  channelType: string;
  status: CapabilityStatus;
  requiredInProduction?: boolean;
  allowTestDoubleInTest?: boolean;
}

export interface NotificationRuntimeDeps {
  readonly repository?: INotificationRepository;
  readonly reliableAdapter?: NotificationReliableOperationAdapter;
  readonly sseAdapter?: NotificationSseAdapter;
  readonly deliverer?: NotificationChannelDeliverer;
  readonly delivererRegistry?: Record<string, NotificationChannelDeliverer>;
  readonly environment?: 'production' | 'development' | 'test';
  readonly channelCapabilities?: ChannelCapabilitySpec[];
  readonly metricsService?: NotificationMetricsService;
  readonly pollIntervalMs?: number;
  readonly backoffBaseMs?: number;
  readonly deadLetterThreshold?: number;
  readonly ownerToken?: string;
  readonly leaseDurationMs?: number;
}

/**
 * Durable runtime port exposed by the channel worker.
 *
 * Extends the module's lifecycle contribution with the durable outbox worker
 * facade (metrics / dead-letter / receipts) and the SSE adapter seam so the
 * composition root can wire live subscription without reaching into the worker.
 */
export interface NotificationDurableRuntimePort extends NotificationModuleRuntimeContribution {
  getDurableRuntime(): NotificationDurableRuntimePort;
  tick(): Promise<void>;
  getMetrics(): NotificationMetricsSnapshot;
  queryDeadLetters(identityId: string): Promise<BusinessOperationReceipt[]>;
  replayDeadLetter(params: { identityId: string; operationId: string }): Promise<BusinessOperationReceipt>;
  queryReceipts(
    identityId: string,
    options?: number | { limit?: number; lastCursor?: string; since?: string; status?: string },
  ): Promise<BusinessOperationReceipt[]>;
  getSseAdapter(): NotificationSseAdapter;
}

function normalizeChannelType(channelType: string): string {
  const lower = channelType.toLowerCase();
  if (lower === 'in-app') return 'InApp';
  if (lower === 'desktop') return 'Desktop';
  if (lower === 'push') return 'Push';
  return channelType;
}

/**
 * Deterministic Notification built from a W1 reminder intent.
 *
 * The notification id equals the stable shared-outbox message id so that a
 * crashed-and-reclaimed worker reuses the same aggregate instead of creating a
 * duplicate with a new random id.
 */
function createNotificationFromSharedIntent(input: {
  id: string;
  identityId: string;
  title: string;
  content: string;
  channelType: string;
}): Notification {
  const channel = NotificationChannel.load({
    id: `${input.id}:${input.channelType}` as never,
    notificationId: input.id as never,
    channelType: input.channelType as never,
    status: ChannelStatus.Pending,
    recipient: input.identityId,
    sendAttempts: 0,
    maxRetries: 3,
    error: null,
    response: null,
    sentAt: null,
    failedAt: null,
  });

  return Notification.load({
    id: input.id as never,
    identityId: input.identityId as never,
    title: input.title,
    content: input.content,
    type: 'Info' as never,
    category: 'Reminder' as never,
    importance: 'Moderate' as never,
    status: 'Pending' as never,
    isRead: false,
    readAt: null,
    actions: null,
    metadata: null,
    navigationIntent: null,
    expiresAt: null,
    version: 1,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    notificationChannels: [channel],
  });
}

/**
 * W2：通知渠道 worker——durable outbox / PENDING 渠道的可靠投递执行者。
 *
 * - 生产启动前根据真实 deliverer registry 检查必需 capability，缺失即 Fail-Fast；
 * - 严格禁止隐式 fallback 或 no-op deliverer 假成功；
 * - 使用 W0 lease/claim 语义竞争 outbox 任务；
 * - 投递成功/失败/重试/dead-letter 全部落库与记录指标；
 * - W1 共享 outbox consumer：在任何外部副作用前建立 durable 幂等记录（NotificationDispatchOutbox），
 *   并通过可过期 lease 恢复崩溃窗口；不重复创建 aggregate/outbox。
 * - 提供按 identity 授权的 dead-letter 查询与 replay 运维接口；
 * - 提供无丢失的 SSE 订阅：先订阅、再补发、按 operationId 去重。
 */
export function createNotificationRuntimeContribution(
  deps?: NotificationRuntimeDeps,
): NotificationDurableRuntimePort {
  if (!deps?.reliableAdapter) {
    throw new Error(
      '[FAIL-FAST] NotificationRuntime requires a reliableAdapter. Non-durable repository fallback is strictly prohibited.',
    );
  }

  const env =
    deps?.environment ??
    ((process.env.NODE_ENV as 'production' | 'development' | 'test') || 'development');
  const ownerToken = deps?.ownerToken ?? `notification-worker:${randomUUID()}`;
  const pollIntervalMs = deps?.pollIntervalMs ?? NOTIFICATION_CHANNEL_POLL_INTERVAL_MS;
  const backoffBaseMs = deps?.backoffBaseMs ?? NOTIFICATION_CHANNEL_BACKOFF_BASE_MS;
  const deadLetterThreshold = deps?.deadLetterThreshold ?? NOTIFICATION_CHANNEL_DEAD_LETTER_THRESHOLD;
  const leaseDurationMs = deps?.leaseDurationMs ?? 30000;
  const metricsService = deps?.metricsService ?? new NotificationMetricsService();
  const sseAdapter = deps?.sseAdapter ?? new NotificationSseAdapter(deps?.reliableAdapter);
  const repository = deps?.repository;
  const reliableAdapter = deps?.reliableAdapter;

  const registry: Record<string, NotificationChannelDeliverer> = {
    ...(deps?.delivererRegistry ?? {}),
  };
  if (deps?.deliverer) {
    registry['InApp'] = registry['InApp'] ?? deps.deliverer;
    registry['Push'] = registry['Push'] ?? deps.deliverer;
    registry['Email'] = registry['Email'] ?? deps.deliverer;
    registry['Sms'] = registry['Sms'] ?? deps.deliverer;
    registry['Webhook'] = registry['Webhook'] ?? deps.deliverer;
  }

  const getDelivererForChannel = (channelType: string): NotificationChannelDeliverer => {
    const normalized = normalizeChannelType(channelType);
    const d = registry[channelType] ?? registry[normalized] ?? deps?.deliverer;
    if (!d) {
      throw new Error(
        `[FAIL-FAST] No deliverer registered for channel '${channelType}'. Implicit fallback or no-op deliverer is strictly prohibited.`,
      );
    }
    const checkAvailable = (item: NotificationChannelDeliverer): boolean => {
      const target = item as unknown as { isAvailable?: () => boolean };
      return typeof target.isAvailable === 'function' ? Boolean(target.isAvailable()) : true;
    };
    if (!checkAvailable(d)) {
      throw new Error(
        `[FAIL-FAST] Channel '${channelType}' deliverer is not capability-available (missing transport/probe failure).`,
      );
    }
    return d;
  };

  const hasDelivererForChannel = (channelType: string): boolean => {
    const normalized = normalizeChannelType(channelType);
    const d = registry[channelType] ?? registry[normalized] ?? deps?.deliverer;
    if (!d) return false;
    const target = d as unknown as { isAvailable?: () => boolean };
    if (typeof target.isAvailable === 'function') {
      return Boolean(target.isAvailable());
    }
    return true;
  };

  // 1. Perform Fail-Fast capability startup check bound to the ACTUAL registry.
  //    A declared 'available' status without a registered deliverer is treated as
  //    'missing' (fail-closed); a registered deliverer upgrades a declared 'missing'
  //    to 'available'. Declared status can never be used to bypass a missing adapter.
  {
    const declaredSpecs = new Map<string, ChannelCapabilitySpec>();
    for (const cap of deps?.channelCapabilities ?? []) {
      declaredSpecs.set(cap.channelType, cap);
      declaredSpecs.set(normalizeChannelType(cap.channelType), cap);
    }

    const channelsToCheck =
      deps?.channelCapabilities && deps.channelCapabilities.length > 0
        ? deps.channelCapabilities.map((c) => c.channelType)
        : [ChannelTypeEnum.InApp, ChannelTypeEnum.Push, 'Desktop'];

    for (const channelType of channelsToCheck) {
      const spec =
        declaredSpecs.get(channelType) ??
        declaredSpecs.get(normalizeChannelType(channelType));
      const available = hasDelivererForChannel(channelType);
      const declaredStatus = spec?.status ?? (available ? 'available' : 'missing');
      const status: CapabilityStatus = available
        ? 'available'
        : declaredStatus === 'test_double'
          ? 'test_double'
          : 'missing';

      const contract: CapabilityRequirementContract = {
        schemaVersion: 1,
        capabilityName: `notification.channel.${channelType.toLowerCase()}`,
        moduleName: 'notification',
        status,
        requiredInProduction: spec?.requiredInProduction ?? true,
        allowTestDoubleInTest: spec?.allowTestDoubleInTest ?? true,
        description: `Notification channel capability for ${channelType}`,
      };
      assertProductionCapabilityOrFailFast(contract, env);
    }
  }

  let started = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let flushing = false;

  const saveNotificationChannels = async (
    notification: Notification | null,
    channel: string,
    errorMsg?: string,
  ): Promise<void> => {
    if (!notification || !repository) return;
    const ch = notification.notificationChannels?.find((c) => c.channelType === channel);
    if (!ch) return;
    if (errorMsg) {
      ch.markAsFailed(ChannelError.create({ code: 'DELIVERY_FAILED', message: errorMsg }));
    }
    await repository.save(notification);
  };

  /**
   * Deliver a claimed durable dispatch outbox entry using W0 lease/claim fencing.
   * Returns the final recorded receipt so callers can reconcile downstream state.
   */
  const processClaimedDispatch = async (entry: {
    claimed: boolean;
    receipt: BusinessOperationReceipt;
    outbox: import('@memoflow/database').NotificationDispatchOutbox;
    notification?: Notification | null;
  }): Promise<BusinessOperationReceipt> => {
    const { receipt, outbox } = entry;
    if (!entry.claimed) return receipt;

    if (!reliableAdapter) {
      throw new Error(
        '[FAIL-FAST] NotificationRuntime requires a reliableAdapter to record delivery receipts.',
      );
    }

    metricsService.recordDispatched();

    const claimContext = {
      ownerToken: receipt.lease?.ownerToken ?? outbox.ownerToken ?? ownerToken,
      fencingToken: receipt.lease?.fencingToken ?? outbox.fencingToken,
    };

    let notification: Notification | null = entry.notification ?? null;
    if (!notification && repository) {
      notification = await repository.findByIdForIdentity(outbox.identityId, outbox.notificationId);
    }

    let payloadData: Record<string, unknown> = {};
    try {
      payloadData = JSON.parse(outbox.payloadJson);
    } catch {
      payloadData = {};
    }

    const deliveryContext = {
      deliveryId: outbox.id,
      idempotencyKey: outbox.idempotencyKey,
      identityId: outbox.identityId,
    };

    try {
      const deliverer = getDelivererForChannel(outbox.channel);

      if (notification) {
        const ch = notification.notificationChannels?.find((c) => c.channelType === outbox.channel);
        if (ch) {
          const alreadyDelivered =
            ch.status === 'Delivered' ||
            ((ch.response as { idempotencyKey?: string; deliveryId?: string } | null)?.idempotencyKey ===
              deliveryContext.idempotencyKey ||
              (ch.response as { idempotencyKey?: string; deliveryId?: string } | null)?.deliveryId ===
                deliveryContext.deliveryId);

          if (!alreadyDelivered) {
            await deliverer.deliver(notification, ch, deliveryContext);
            if (ch.status === 'Pending') {
              ch.send();
              ch.markAsDelivered();
            }
          }
        } else {
          const tempChannel = NotificationChannel.create({
            notificationId: notification.id,
            channelType: outbox.channel as never,
            recipient: outbox.identityId,
          });
          await deliverer.deliver(notification, tempChannel, deliveryContext);
        }
      } else {
        // No persisted Notification aggregate: deliver standalone from the outbox payload.
        await deliverer.deliver(
          {
            id: outbox.notificationId,
            identityId: outbox.identityId,
            title: (payloadData.title as string) ?? 'Notification',
            content: (payloadData.content as string) ?? '',
            type: (payloadData.type as never) ?? 'Info',
            category: (payloadData.category as never) ?? 'System',
          } as never,
          {
            channelType: outbox.channel,
            recipient: outbox.identityId,
          } as never,
          deliveryContext,
        );
      }

      const updatedReceipt: BusinessOperationReceipt = {
        ...receipt,
        status: 'succeeded',
        lease: null,
        finishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attemptsHistory: [
          ...(receipt.attemptsHistory ?? []),
          {
            schemaVersion: 1,
            attempt: receipt.attempt,
            attemptedAt: new Date().toISOString(),
            result: 'succeeded',
            error: null,
            durationMs: null,
            channel: outbox.channel,
          },
        ],
      };

      const recordedReceipt = await reliableAdapter.recordDeliveryReceipt(updatedReceipt, claimContext);
      const isApplied = (recordedReceipt as unknown as { applied?: boolean }).applied !== false;

      if (recordedReceipt.status === 'succeeded' && isApplied) {
        await saveNotificationChannels(notification, outbox.channel);
        metricsService.recordDelivered();

        // SSE is a read-only outbox consumer: broadcast the real-time delivery
        // event only AFTER the durable receipt is persisted.
        sseAdapter.broadcastDeliveryEvent(outbox.identityId, recordedReceipt, {
          outboxChannel: outbox.channel,
          notificationId: outbox.notificationId,
          title: (payloadData.title as string) ?? 'Notification',
          content: (payloadData.content as string) ?? '',
          category: (payloadData.category as string) ?? 'System',
          type: (payloadData.type as string) ?? 'Info',
          data: payloadData,
        });

        logger.info('[NotificationRuntime] Outbox dispatch succeeded', {
          operationId: outbox.id,
          channel: outbox.channel,
          identityId: outbox.identityId,
        });
      } else {
        logger.warn('[NotificationRuntime] Outbox completion condition failed (stale owner or preempted)', {
          operationId: outbox.id,
          expectedStatus: 'succeeded',
          actualStatus: recordedReceipt.status,
        });
      }
      return recordedReceipt;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isDeadLetter = receipt.attempt >= deadLetterThreshold;

      if (isDeadLetter) {
        const deadReceipt: BusinessOperationReceipt = {
          ...receipt,
          status: 'dead_letter',
          lease: null,
          deadLetterAt: new Date().toISOString(),
          lastError: errorMsg,
          updatedAt: new Date().toISOString(),
          attemptsHistory: [
            ...(receipt.attemptsHistory ?? []),
            {
              schemaVersion: 1,
              attempt: receipt.attempt,
              attemptedAt: new Date().toISOString(),
              result: 'failed',
              error: errorMsg,
              durationMs: null,
              channel: outbox.channel,
            },
          ],
        };

        const recordedReceipt = await reliableAdapter.recordDeliveryReceipt(deadReceipt, claimContext);
        if (recordedReceipt.status === 'dead_letter') {
          await saveNotificationChannels(notification, outbox.channel, errorMsg);
          metricsService.recordFailed();
          metricsService.recordDeadLetter();

          logger.error('[NotificationRuntime] Outbox dispatch reached dead-letter state', {
            operationId: outbox.id,
            channel: outbox.channel,
            attempts: receipt.attempt,
            error: errorMsg,
          });
        } else {
          logger.warn('[NotificationRuntime] Outbox dead-letter completion ignored (stale owner)', {
            operationId: outbox.id,
          });
        }
        return recordedReceipt;
      }

      const backoffMs = backoffBaseMs * 2 ** Math.max(0, receipt.attempt - 1);
      const nextRetryAt = new Date(Date.now() + backoffMs).toISOString();

      const retryReceipt: BusinessOperationReceipt = {
        ...receipt,
        status: 'retryable',
        lease: null,
        nextRetryAt,
        lastError: errorMsg,
        updatedAt: new Date().toISOString(),
        attemptsHistory: [
          ...(receipt.attemptsHistory ?? []),
          {
            schemaVersion: 1,
            attempt: receipt.attempt,
            attemptedAt: new Date().toISOString(),
            result: 'retryable',
            error: errorMsg,
            durationMs: null,
            channel: outbox.channel,
          },
        ],
      };

      const recordedReceipt = await reliableAdapter.recordDeliveryReceipt(retryReceipt, claimContext);
      if (recordedReceipt.status === 'retryable') {
        await saveNotificationChannels(notification, outbox.channel, errorMsg);
        metricsService.recordFailed();
        metricsService.recordRetry();

        logger.warn('[NotificationRuntime] Outbox dispatch failed, scheduled retry', {
          operationId: outbox.id,
          channel: outbox.channel,
          attempts: receipt.attempt,
          nextRetryAt,
          error: errorMsg,
        });
      } else {
        logger.warn('[NotificationRuntime] Outbox retry completion ignored (stale owner)', {
          operationId: outbox.id,
        });
      }
      return recordedReceipt;
    }
  };

  const tick = async (): Promise<void> => {
    if (!deps?.reliableAdapter) {
      throw new Error(
        '[FAIL-FAST] NotificationRuntime requires a reliableAdapter. Non-durable repository fallback is strictly prohibited.',
      );
    }
    if (flushing) return;
    flushing = true;
    try {
      // Priority 1: Process the durable NotificationDispatchOutbox via lease/claim.
      const claimedEntries = await deps.reliableAdapter.claimOutboxDispatch({
        ownerToken,
        leaseDurationMs,
        limit: 50,
      });

      for (const entry of claimedEntries) {
        await processClaimedDispatch(entry);
      }

      // Priority 2: Cross-module shared OutboxMessage (messageType: 'notification.dispatch') from W1.
      // The durable idempotency fence (NotificationDispatchOutbox) is established BEFORE any
      // external side effect, and the shared row's leaseExpiresAt deadline acts as a recoverable lease.
      const sharedOutboxes = await deps.reliableAdapter.claimSharedOutboxIntents({
        ownerToken,
        leaseDurationMs,
        limit: 50,
      });

      const pendingSharedById = new Map<
        string,
        {
          sharedMsg: import('@memoflow/database').OutboxMessage;
          notification: Notification;
          leaseContext: { ownerToken: string; claimId: string; fencingToken: number };
        }
      >();

      for (const sharedMsg of sharedOutboxes) {
        const leaseContext = {
          ownerToken: sharedMsg.ownerToken!,
          claimId: sharedMsg.claimId!,
          fencingToken: sharedMsg.fencingToken!,
        };
        try {
          const outerPayload = JSON.parse(sharedMsg.payloadJson);
          let innerPayload: Record<string, unknown> = {};
          try {
            innerPayload =
              typeof outerPayload.payloadJson === 'string'
                ? JSON.parse(outerPayload.payloadJson)
                : (outerPayload.payloadJson as Record<string, unknown>) || outerPayload;
          } catch {
            innerPayload = {};
          }

          const title = (innerPayload.title as string) || (outerPayload.title as string) || 'Notification';
          const content =
            (innerPayload.description as string) ||
            (innerPayload.content as string) ||
            (outerPayload.content as string) ||
            title;
          const rawChannel = (outerPayload.channel as string) || 'InApp';
          const channelType = rawChannel.toLowerCase() === 'in-app' ? 'InApp' : rawChannel;
          const identityId = (sharedMsg.identityId as string) || (outerPayload.identityId as string);
          const idempotencyKey = sharedMsg.idempotencyKey || (outerPayload.idempotencyKey as string);
          // Deterministic id across re-claims: the shared message id (W1 operationId).
          const resolvedNotificationId = (outerPayload.notificationId as string) || sharedMsg.id;

          let notification: Notification | null = null;
          if (deps.repository) {
            notification = await deps.repository.findByIdForIdentity(identityId, resolvedNotificationId);
          }
          if (!notification) {
            notification = createNotificationFromSharedIntent({
              id: resolvedNotificationId,
              identityId,
              title,
              content,
              channelType,
            });
            if (!deps.repository) {
              throw new Error(
                '[FAIL-FAST] Shared outbox consumer requires a repository to persist the ' +
                  'Notification aggregate before recording a durable dispatch intent.',
              );
            }
            // Persist the Notification aggregate BEFORE recording the durable
            // dispatch intent: NotificationDispatchOutbox.notificationId is a real
            // FK to the Notification table and must reference an existing row.
            // W1 occurrenceKeys (`${templateId}:${time}`) are opaque, so the
            // consumer owns creating the Notification entity and using its id.
            await deps.repository.save(notification);
          }

          // Durable idempotency fence BEFORE any external side effect. Idempotent by
          // unique idempotencyKey: a re-claimed attempt returns the existing row.
          const dispatchReceipt = await deps.reliableAdapter.dispatchOutbox(
            {
              operationId: (outerPayload.operationId as string) || sharedMsg.id,
              identityId,
              source: 'notification',
              occurrenceKey: (outerPayload.occurrenceKey as string) || `reminder:${sharedMsg.id}`,
              channel: channelType,
              payloadJson: JSON.stringify({ notificationId: resolvedNotificationId, title, content }),
              idempotencyKey,
            },
            { notificationId: resolvedNotificationId },
          );

          if (dispatchReceipt.status === 'succeeded') {
            // A previous attempt already completed delivery (crash happened after the
            // receipt was persisted but before the shared status write).
            const res = await deps.reliableAdapter.updateSharedOutboxStatus(
              sharedMsg.id,
              'succeeded',
              null,
              null,
              leaseContext,
            );
            if (res === 'ok') {
              metricsService.recordDelivered();
            } else {
              logger.warn('[NotificationRuntime] Shared outbox completion returned conflict (stale owner ignored)', {
                operationId: sharedMsg.id,
              });
            }
            continue;
          }

          pendingSharedById.set(sharedMsg.id, { sharedMsg, notification, leaseContext });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          const isDeadLetter = sharedMsg.attempts >= deadLetterThreshold;
          if (isDeadLetter) {
            const res = await deps.reliableAdapter.updateSharedOutboxStatus(
              sharedMsg.id,
              'dead_letter',
              errorMsg,
              null,
              leaseContext,
            );
            if (res === 'ok') {
              metricsService.recordFailed();
              metricsService.recordDeadLetter();
            } else {
              logger.warn('[NotificationRuntime] Shared outbox dead-letter returned conflict (stale owner ignored)', {
                operationId: sharedMsg.id,
              });
            }
            logger.error('[NotificationRuntime] Shared outbox reached dead-letter state', {
              operationId: sharedMsg.id,
              attempts: sharedMsg.attempts,
              error: errorMsg,
            });
          } else {
            const backoffMs = backoffBaseMs * 2 ** Math.max(0, sharedMsg.attempts - 1);
            const res = await deps.reliableAdapter.updateSharedOutboxStatus(
              sharedMsg.id,
              'retryable',
              errorMsg,
              new Date(Date.now() + backoffMs),
              leaseContext,
            );
            if (res === 'ok') {
              metricsService.recordFailed();
              metricsService.recordRetry();
            } else {
              logger.warn('[NotificationRuntime] Shared outbox retryable returned conflict (stale owner ignored)', {
                operationId: sharedMsg.id,
              });
            }
            logger.warn('[NotificationRuntime] Shared outbox dispatch failed, scheduled retry', {
              operationId: sharedMsg.id,
              attempts: sharedMsg.attempts,
              error: errorMsg,
            });
          }
        }
      }

      // Deliver the newly-created durable dispatch outbox rows through the standard
      // lease/claim path. Rows claimed by a concurrent worker are completed there and
      // reconciled on the next shared-message re-claim (idempotent dispatchOutbox).
      if (pendingSharedById.size > 0) {
        const claimedEntries = await deps.reliableAdapter.claimOutboxDispatch({
          ownerToken,
          leaseDurationMs,
          limit: 50,
        });

        for (const entry of claimedEntries) {
          const pending = pendingSharedById.get(entry.outbox.id);
          if (!pending) continue;

          const finalReceipt = await processClaimedDispatch({
            ...entry,
            notification: pending.notification,
          });

          if (finalReceipt.status === 'succeeded') {
            const res = await deps.reliableAdapter.updateSharedOutboxStatus(
              entry.outbox.id,
              'succeeded',
              null,
              null,
              pending.leaseContext,
            );
            if (res !== 'ok') {
              logger.warn('[NotificationRuntime] Shared outbox completion returned conflict (stale owner ignored)', {
                operationId: entry.outbox.id,
              });
            }
          } else if (finalReceipt.status === 'dead_letter') {
            const res = await deps.reliableAdapter.updateSharedOutboxStatus(
              entry.outbox.id,
              'dead_letter',
              finalReceipt.lastError,
              null,
              pending.leaseContext,
            );
            if (res !== 'ok') {
              logger.warn('[NotificationRuntime] Shared outbox dead-letter returned conflict (stale owner ignored)', {
                operationId: entry.outbox.id,
              });
            }
          } else {
            const backoffMs = backoffBaseMs * 2 ** Math.max(0, pending.sharedMsg.attempts - 1);
            const res = await deps.reliableAdapter.updateSharedOutboxStatus(
              entry.outbox.id,
              'retryable',
              finalReceipt.lastError,
              new Date(Date.now() + backoffMs),
              pending.leaseContext,
            );
            if (res !== 'ok') {
              logger.warn('[NotificationRuntime] Shared outbox retryable returned conflict (stale owner ignored)', {
                operationId: entry.outbox.id,
              });
            }
          }
        }
      }

      // Priority 3: Recovery Projection — reconstruct channel response from durable ack for succeeded outboxes with missing channel response
      const reconcileUnprojectedOutboxes = async (): Promise<void> => {
        if (!deps?.repository || !deps?.reliableAdapter) return;
        const querySucceeded = (deps.reliableAdapter as unknown as { querySucceededOutboxes?: (options?: number | { limit?: number; lastCursor?: string }) => Promise<Array<Record<string, unknown>>> }).querySucceededOutboxes;
        if (typeof querySucceeded !== 'function') return;

        let lastCursor: string | undefined = undefined;
        let pageCount = 0;
        const maxPages = 5;

        while (pageCount < maxPages) {
          pageCount++;
          const succeededOutboxes = await querySucceeded.call(deps.reliableAdapter, { limit: 50, lastCursor });
          if (!Array.isArray(succeededOutboxes) || succeededOutboxes.length === 0) {
            break;
          }

          for (const outboxItem of succeededOutboxes) {
            const identityId = (outboxItem.identityId ?? outboxItem.identity_id) as string | undefined;
            const notificationId = (outboxItem.notificationId ?? outboxItem.notification_id) as string | undefined;
            const idempotencyKey = (outboxItem.idempotencyKey ?? outboxItem.idempotency_key) as string | undefined;
            const channelName = outboxItem.channel as string | undefined;
            const deliveryId = outboxItem.id as string | undefined;
            const updatedAtIso = (outboxItem.updatedAt ?? outboxItem.updated_at) as string | undefined;

            if (updatedAtIso && deliveryId) {
              const { encodeReceiptCursor } = await import('../adapters/powersync/power-sync-notification-reliable.adapter');
              lastCursor = encodeReceiptCursor(updatedAtIso, deliveryId);
            }

            if (!identityId || !notificationId || !idempotencyKey || !channelName || !deliveryId) continue;

            const notification = await deps.repository.findByIdForIdentity(identityId, notificationId);
            if (!notification) continue;

            const ch = notification.notificationChannels?.find((c) => c.channelType === channelName);
            if (!ch) continue;

            const isResponseComplete =
              (ch.status === 'Sent' || ch.status === 'Delivered') &&
              Boolean(ch.response);
            if (isResponseComplete) continue;

            // Channel response is missing! Try fetching durable ack from deliverer/transport
            try {
              const deliverer = getDelivererForChannel(channelName);
              const getAckFn = (deliverer as unknown as { getAck?: (key: string) => Promise<unknown> }).getAck;
              if (typeof getAckFn === 'function') {
                const ack = (await getAckFn.call(deliverer, idempotencyKey)) as { ackId?: string; status?: string; timestamp?: number } | null;
                if (ack && ack.status === 'delivered' && Boolean(ack.ackId)) {
                  const { ChannelResponse } = await import('../../domain/value-objects/channel-response');
                  const resp = ChannelResponse.success(idempotencyKey, {
                    deliveryId,
                    idempotencyKey,
                    ack,
                  });
                  const chObj = ch as unknown as Record<string, unknown>;
                  if (typeof chObj.markAsDelivered === 'function') {
                    try {
                      if (chObj.status === 'Pending' && typeof chObj.send === 'function') {
                        (chObj.send as () => void)();
                      }
                      (chObj.markAsDelivered as (r: unknown) => void)(resp);
                    } catch {
                      if (typeof chObj.setResponse === 'function') {
                        (chObj.setResponse as (r: unknown) => void)(resp);
                      } else if (chObj._props && typeof chObj._props === 'object') {
                        (chObj._props as Record<string, unknown>).response = resp;
                      } else {
                        chObj.response = resp.toDTO();
                      }
                    }
                  } else if (typeof chObj.setResponse === 'function') {
                    (chObj.setResponse as (r: unknown) => void)(resp);
                  } else {
                    chObj.response = resp.toDTO();
                  }

                  await deps.repository.save(notification);
                  logger.info('[NotificationRuntime] Projected missing channel response from durable ack', {
                    operationId: deliveryId,
                    idempotencyKey,
                    notificationId,
                  });
                }
              }
            } catch (err) {
              logger.warn('[NotificationRuntime] Failed to reconcile unprojected channel response', {
                operationId: deliveryId,
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }

          if (succeededOutboxes.length < 50) {
            break;
          }
        }
      };

      await reconcileUnprojectedOutboxes();
    } catch (error) {
      logger.error('[NotificationRuntime] Channel worker tick failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      flushing = false;
    }
  };

  return {
    start(): void {
      if (!deps?.reliableAdapter) {
        throw new Error(
          '[FAIL-FAST] NotificationRuntime requires a reliableAdapter. Non-durable repository fallback is strictly prohibited.',
        );
      }
      if (started) return;
      started = true;
      void tick();
      timer = setInterval(() => void tick(), pollIntervalMs);
      timer.unref?.();
      logger.info('[Notification] Channel worker started', { pollIntervalMs });
    },

    stop(): void {
      if (!started) return;
      started = false;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      logger.info('[Notification] Channel worker stopped');
    },

    tick,

    getDurableRuntime(): NotificationDurableRuntimePort {
      return this;
    },

    getMetrics(): NotificationMetricsSnapshot {
      return metricsService.getMetrics();
    },

    async queryDeadLetters(identityId: string): Promise<BusinessOperationReceipt[]> {
      if (!deps?.reliableAdapter) {
        throw new Error('Reliable adapter is required to query dead letters.');
      }
      return deps.reliableAdapter.queryDeadLetters(identityId);
    },

    async replayDeadLetter(params: { identityId: string; operationId: string }): Promise<BusinessOperationReceipt> {
      if (!deps?.reliableAdapter) {
        throw new Error('Reliable adapter is required to replay dead letters.');
      }
      const receipt = await deps.reliableAdapter.replayDeadLetter(params);
      void tick();
      return receipt;
    },

    async queryReceipts(
      identityId: string,
      options?: number | { limit?: number; lastCursor?: string; since?: string; status?: string },
    ): Promise<BusinessOperationReceipt[]> {
      if (!deps?.reliableAdapter) {
        throw new Error('Reliable adapter is required to query delivery receipts.');
      }
      return deps.reliableAdapter.queryReceipts(identityId, options);
    },

    getSseAdapter(): NotificationSseAdapter {
      return sseAdapter;
    },
  };
}
