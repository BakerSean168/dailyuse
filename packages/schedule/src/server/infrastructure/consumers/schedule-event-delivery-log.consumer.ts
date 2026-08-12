import type { PrismaClient } from '@memoflow/database';
import type { EventDeliveryMetadata } from '@memoflow/utils/domain';

/**
 * P1-1 production consumer：Schedule domain events 的可靠、幂等消费。
 *
 * 监听 schedule domain events（created/updated/deleted/rescheduled），在**同一个
 * 真实事务**中写入：
 *   1. consumer-specific receipt（ScheduleEventConsumerReceipt，idempotencyKey unique）
 *   2. 独立持久业务副作用（ScheduleEventDeliveryLog，idempotencyKey 独立 unique）
 *
 * 并发 duplicate delivery 时，loser 的 `create` 会撞上唯一约束（P2002）——这里
 * 显式把该冲突识别为「已消费成功」（返回 success 不抛）；非 duplicate 的失败
 * （事务回滚、业务写失败）则抛出，由可靠 publisher 阻止 completed 并进入
 * retry/failed。
 */
export class ScheduleEventDeliveryLogConsumer {
  private readonly handlers: {
    eventType: string;
    handler: (payload: unknown, metadata?: EventDeliveryMetadata) => void;
  }[] = [];

  constructor(
    private readonly prisma: PrismaClient,
    private readonly bus: ScheduleEventDeliveryLogEventBus,
  ) {}

  async handle(
    eventType: string,
    payload: unknown,
    metadata?: EventDeliveryMetadata,
  ): Promise<void> {
    const key = metadata?.idempotencyKey;
    if (!key) {
      throw new Error('at-least-once delivery requires idempotencyKey at the consumer entry');
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.scheduleEventConsumerReceipt.findUnique({
        where: { idempotencyKey: key },
      });
      if (existing) {
        // 已消费（串行重投）：幂等成功。
        return;
      }

      try {
        await tx.scheduleEventConsumerReceipt.create({
          data: { idempotencyKey: key },
        });
      } catch (error) {
        if (isPrismaUniqueViolation(error)) {
          // 并发 duplicate：另一事务已提交同一 key 的 receipt → 显式幂等成功。
          return;
        }
        throw error;
      }

      // 独立持久业务副作用，与 receipt 同事务提交（任一方失败整体回滚）。
      await tx.scheduleEventDeliveryLog.create({
        data: {
          idempotencyKey: key,
          eventType,
          aggregateId: metadata?.aggregateId ?? null,
        },
      });
    });
  }

  /**
   * 注册到事件总线（module-owned runtime start）。
   * 每个 event type 关闭捕获其 eventType，随 envelope metadata 一起交给 handle。
   * handler 必须返回 Promise（而非 void 丢弃），这样 bus 的 in-flight 追踪能等待
   * consumer 事务完成后才允许 publisher ack。
   */
  start(): void {
    for (const eventType of SCHEDULE_DELIVERY_LOG_EVENT_TYPES) {
      const handler = (payload: unknown, metadata?: EventDeliveryMetadata): Promise<void> =>
        this.handle(eventType, payload, metadata);
      this.bus.on(eventType, handler);
      this.handlers.push({ eventType, handler });
    }
  }

  stop(): void {
    for (const { eventType, handler } of this.handlers) {
      this.bus.off(eventType, handler);
    }
    this.handlers.length = 0;
  }
}

/** 该消费者订阅的 schedule domain event types（与 calendar-entry 聚合发布一致）。 */
export const SCHEDULE_DELIVERY_LOG_EVENT_TYPES = [
  'schedule:calendar-entry-created',
  'schedule:calendar-entry-updated',
  'schedule:calendar-entry-rescheduled',
  'schedule:calendar-entry-deleted',
] as const;

/** 允许注入测试 bus；默认为 utils/domain 的全局 eventBus（见组合根）。 */
export interface ScheduleEventDeliveryLogEventBus {
  on(
    eventType: string,
    handler: (payload: unknown, metadata?: EventDeliveryMetadata) => void,
  ): unknown;
  off(
    eventType: string,
    handler: (payload: unknown, metadata?: EventDeliveryMetadata) => void,
  ): unknown;
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}
