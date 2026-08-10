import type { NotificationChannelDeliverer, NotificationDeliveryContext } from '../../runtime/notification.runtime';
import type { Notification } from '../../../domain/aggregates/notification';
import type { INotificationRepository } from '../../../domain/repositories/i-notification-repository';
import { createTypedEventPublisher, eventBus } from '@memoflow/utils/domain';
import type {
  NotificationDispatchDesktopEvent,
  NotificationEventMap,
} from '@memoflow/contracts/notification';
import { ChannelResponse } from '../../../domain/value-objects/channel-response';
import { ChannelError } from '../../../domain/value-objects/channel-error';

const notificationDispatchEvents = createTypedEventPublisher<
  Pick<NotificationEventMap, 'notification:dispatch_in_app' | 'notification:dispatch_desktop'>
>(eventBus);

/**
 * Real In-App Notification Deliverer.
 * 真实 In-App 通知投递适配器：写入持久化 Notification 仓储，发布进程内 in-app 事件供实时/SSE/列表查询。
 */
type TargetObject = Record<string, unknown>;

export class RealInAppChannelDeliverer implements NotificationChannelDeliverer {
  constructor(private readonly repository?: INotificationRepository) {}

  async deliver(
    notification: Notification,
    channel: NonNullable<Notification['notificationChannels']>[number],
    context?: NotificationDeliveryContext,
  ): Promise<void> {
    const isDomainObject = typeof (notification as unknown as { toServerDTO?: unknown }).toServerDTO === 'function';

    if (context?.idempotencyKey && channel) {
      const resp = ChannelResponse.success(context.idempotencyKey, {
        deliveryId: context.deliveryId,
        idempotencyKey: context.idempotencyKey,
      });
      const ch = channel as unknown as TargetObject;
      if (typeof ch.markAsDelivered === 'function') {
        try {
          if (ch.status === 'Pending' && typeof ch.send === 'function') {
            (ch.send as () => void)();
          }
          (ch.markAsDelivered as (r: unknown) => void)(resp);
        } catch {
          if (typeof ch.setResponse === 'function') {
            (ch.setResponse as (r: unknown) => void)(resp);
          } else if (ch._props && typeof ch._props === 'object') {
            (ch._props as TargetObject).response = resp;
          } else {
            ch.response = resp.toDTO();
          }
        }
      } else if (typeof ch.setResponse === 'function') {
        (ch.setResponse as (r: unknown) => void)(resp);
      } else if (ch._props && typeof ch._props === 'object') {
        (ch._props as TargetObject).response = resp;
      } else {
        ch.response = resp.toDTO();
      }
    }

    if (this.repository && isDomainObject) {
      try {
        await this.repository.save(notification);
      } catch (err) {
        if (context?.idempotencyKey && channel) {
          try {
            const channelErr = ChannelError.of(
              'SAVE_FAILED',
              err instanceof Error ? err.message : String(err),
              { idempotencyKey: context.idempotencyKey },
            );
            const ch = channel as unknown as TargetObject;
            if (typeof ch.markAsFailed === 'function') {
              (ch.markAsFailed as (e: unknown) => void)(channelErr);
            } else {
              ch.error = channelErr.toDTO();
            }
          } catch {
            // Ignore state modification errors
          }
        }
        throw err;
      }
    }
  }
}

/**
 * Real Desktop / Push Notification Deliverer.
 * 真实 Desktop / Push 通知投递适配器。
 * Note: Desktop/Push 生产通道需 Electron transport 才启用。
 * 若没有真实跨进程 transport，抛出 "production transport unavailable" 错误（fail-closed），防止假成功。
 */
type TransportDeliverFn = (dto: unknown, context?: unknown) => Promise<unknown> | unknown;

/**
 * Resolve the callable deliver/send function from a transport object.
 * A transport is only usable when it exposes an invokable `deliver` or `send`
 * function (or is itself a function). Truthy-but-method-less transports are unusable.
 */
export function getTransportDeliverFn(transport: unknown): TransportDeliverFn | null {
  if (!transport) return null;
  const t = transport as TargetObject;
  if (typeof t.deliver === 'function') return t.deliver as TransportDeliverFn;
  if (typeof t.send === 'function') return t.send as TransportDeliverFn;
  if (typeof transport === 'function') return transport as TransportDeliverFn;
  return null;
}

/**
 * A valid delivery ack proves the transport actually delivered the notification:
 * it must carry a non-empty `ackId` and `status: 'delivered'`. Anything else
 * (undefined, null, plain object, `status: 'failed'`, missing ackId) is NOT success.
 */
export function isDeliveredAck(ack: unknown): ack is { ackId: string; status: 'delivered'; timestamp?: number } {
  if (!ack || typeof ack !== 'object' || Array.isArray(ack)) return false;
  const candidate = ack as TargetObject;
  return (
    typeof candidate.ackId === 'string' &&
    (candidate.ackId as string).length > 0 &&
    candidate.status === 'delivered'
  );
}

function describeAck(ack: unknown): string {
  if (ack === undefined) return 'undefined';
  if (ack === null) return 'null';
  if (typeof ack === 'object') {
    try {
      return JSON.stringify(ack);
    } catch {
      return String(ack);
    }
  }
  return String(ack);
}

export class RealDesktopChannelDeliverer implements NotificationChannelDeliverer {
  constructor(private readonly transport?: unknown) {}

  isAvailable(): boolean {
    return getTransportDeliverFn(this.transport) !== null;
  }

  async getAck(idempotencyKey: string): Promise<{ ackId: string; status: string; timestamp?: number } | null> {
    if (!this.transport) return null;
    const t = this.transport as { getAck?: (key: string) => Promise<unknown> | unknown; getAckStore?: () => unknown };
    if (typeof t.getAck === 'function') {
      const ack = await t.getAck(idempotencyKey);
      return (ack as { ackId: string; status: string; timestamp?: number }) ?? null;
    }
    const store = typeof t.getAckStore === 'function' ? (t.getAckStore() as { getAck?: (key: string) => Promise<unknown> | unknown }) : null;
    if (store && typeof store.getAck === 'function') {
      const ack = await store.getAck(idempotencyKey);
      return (ack as { ackId: string; status: string; timestamp?: number }) ?? null;
    }
    return null;
  }

  async deliver(
    notification: Notification,
    channel: NonNullable<Notification['notificationChannels']>[number],
    context?: NotificationDeliveryContext,
  ): Promise<void> {
    const transportDeliver = getTransportDeliverFn(this.transport);
    if (!transportDeliver) {
      // Desktop/Push 生产通道需真实 transport（带可调用的 deliver/send）才启用
      throw new Error(
        'production transport unavailable: transport is missing or has no callable deliver/send function',
      );
    }

    const isDomainObject = typeof (notification as unknown as { toServerDTO?: unknown }).toServerDTO === 'function';
    const dto = isDomainObject
      ? notification.toServerDTO()
      : (notification as unknown as TargetObject);

    const rawAck = await transportDeliver(dto, context);

    // Fail-closed ack validation: a delivery only counts as success when the
    // transport returned a valid ack (non-empty ackId + status 'delivered').
    // Empty / missing / failed acks must surface as errors so the durable worker
    // schedules a retry — fabricated success is strictly prohibited.
    if (!isDeliveredAck(rawAck)) {
      throw new Error(
        `transport did not return a valid delivery ack (non-empty ackId and status 'delivered' required); got: ${describeAck(rawAck)}`,
      );
    }
    const ack = rawAck;

    if (context?.idempotencyKey && channel) {
      const resp = ChannelResponse.success(context.idempotencyKey, {
        deliveryId: context.deliveryId,
        idempotencyKey: context.idempotencyKey,
        ack,
      });
      const ch = channel as unknown as TargetObject;
      if (typeof ch.markAsDelivered === 'function') {
        try {
          if (ch.status === 'Pending' && typeof ch.send === 'function') {
            (ch.send as () => void)();
          }
          (ch.markAsDelivered as (r: unknown) => void)(resp);
        } catch {
          if (typeof ch.setResponse === 'function') {
            (ch.setResponse as (r: unknown) => void)(resp);
          } else if (ch._props && typeof ch._props === 'object') {
            (ch._props as TargetObject).response = resp;
          } else {
            ch.response = resp.toDTO();
          }
        }
      } else if (typeof ch.setResponse === 'function') {
        (ch.setResponse as (r: unknown) => void)(resp);
      } else if (ch._props && typeof ch._props === 'object') {
        (ch._props as TargetObject).response = resp;
      } else {
        ch.response = resp.toDTO();
      }
    }

    notificationDispatchEvents.send('notification:dispatch_desktop', {
      id: (dto.id as NotificationDispatchDesktopEvent['id']) ?? ('' as NotificationDispatchDesktopEvent['id']),
      identityId: (dto.identityId as NotificationDispatchDesktopEvent['identityId']) ?? ('' as NotificationDispatchDesktopEvent['identityId']),
      title: (dto.title as string) ?? 'Notification',
      body: (dto.content as string) ?? '',
      category: (dto.category ?? 'System') as NotificationDispatchDesktopEvent['category'],
      type: (dto.type ?? 'Info') as NotificationDispatchDesktopEvent['type'],
      importance: (dto.importance ?? 'Normal') as NonNullable<NotificationDispatchDesktopEvent['importance']>,
      data: ((dto as TargetObject).data as Record<string, unknown>) ?? {},
      sound: { enabled: true, name: null },
    });
  }
}
