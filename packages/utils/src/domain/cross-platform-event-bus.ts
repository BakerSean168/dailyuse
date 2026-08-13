/** 随事件 envelope 传递的投递元数据（at-least-once 幂等去重键等）。 */
export interface EventDeliveryMetadata {
  aggregateId?: string;
  occurredAt?: Date;
  idempotencyKey?: string;
}

import mitt, { type Emitter, type Handler } from 'mitt';
import { createLogger } from '../logger';

// 基础类型约束
type EventMap = Record<string, any>;

const logger = createLogger('CrossPlatformEventBus');

/**
 * 跨平台单向事件总线
 * 基于 mitt 实现，支持浏览器和 Node.js 环境。
 *
 * 只承载「通知式反应」（ADR-033 范式 A）：发布方 `send`，订阅方 `on`/`off`，
 * 发布方不关心也不等待订阅方返回。同进程请求-响应走 Port（范式 B），
 * 跨进程走 `@memoflow/ipc-client` / HTTP（范式 C）。
 *
 * @see docs/architecture/adr/ADR-033-cross-module-communication-patterns.md
 */
export class CrossPlatformEventBus<TEvents extends EventMap = EventMap> {
  private emitter: Emitter<any>;
  private debugEnabled = false;
  private inFlight = new Set<Promise<unknown>>();
  /** 同步抛出的 handler 错误（仅在最近的 send() 期间累积，send 前清空）。 */
  private pendingErrors: unknown[] = [];

  constructor() {
    this.emitter = mitt();
  }

  /**
   * 等待当前 in-flight 的 handler 完成（at-least-once 投递边界）。
   * 发布方可在 ack durable outbox 前调用，确保消费方事务先于 ack。
   *
   * 与通知式 `send`（fire-and-forget、错误隔离）不同，`awaitDrain` 面向可靠
   * 发布者：若任一 handler 同步抛出或异步 reject，这里会抛出第一个错误，
   * 使可靠 publisher 能阻止 completed 并进入 retry/failed。默认 send 仍保持
   * 通知式隔离语义（ADR-033 不变）。
   */
  async awaitDrain(): Promise<void> {
    const errors: unknown[] = this.pendingErrors.slice();
    this.pendingErrors = [];
    while (this.inFlight.size > 0) {
      const pending = Array.from(this.inFlight);
      const settled = await Promise.allSettled(pending);
      for (const outcome of settled) {
        if (outcome.status === 'rejected') {
          errors.push(outcome.reason);
        }
      }
    }
    if (errors.length > 0) {
      const first = errors[0];
      throw first instanceof Error ? first : new Error(String(first));
    }
  }

  /**
   * 发布单向事件。
   *
   * 遍历订阅者并逐个 try/catch：任一订阅者抛错只记录日志，不影响其余订阅者，
   * 也不冒泡给发布方（H3 错误隔离）。日志受 debug 门控，热路径不展开 payload（M1）。
   *
   * @param eventType 事件类型
   * @param payload 事件负载
   */
  send<K extends keyof TEvents>(
    eventType: K,
    payload: TEvents[K],
    metadata?: EventDeliveryMetadata,
  ): void {
    const type = eventType as string;
    if (this.debugEnabled) logger.debug(`📤 Send: ${type}`, payload);

    // send 是通知式入口：清掉上一次 fire-and-forget send 遗留的同步错误，
    // 这样紧随其后的 awaitDrain() 只会看到本次 send 期间的错误。
    this.pendingErrors = [];

    // mitt 内部对同一 key 的 handler 是同步顺序调用；这里取出快照逐个隔离执行，
    // 避免某个订阅者抛错中断后续订阅者（mitt.emit 本身无 per-handler 隔离）。
    const handlers = this.emitter.all.get(type) as Array<Handler<any>> | undefined;
    if (!handlers || handlers.length === 0) return;

    for (const handler of [...handlers]) {
      this.invokeHandler(type, handler, payload, metadata);
    }
  }

  private invokeHandler(
    type: string,
    handler: Handler<any>,
    payload: unknown,
    metadata?: EventDeliveryMetadata,
  ): void {
    let result: unknown;
    try {
      result =
        metadata === undefined
          ? (handler as (event: unknown) => unknown)(payload)
          : (handler as (event: unknown, metadata: EventDeliveryMetadata) => unknown)(payload, metadata);
    } catch (error) {
      // 同步抛出：send 本身仍不冒泡（H3 隔离），但记录给 awaitDrain()，
      // 让可靠发布者能感知该 handler 失败（阻止错误 ack）。
      logger.error(`❌ Event handler failed: ${type}`, error);
      this.pendingErrors.push(error);
      return;
    }
    if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
      const tracked = Promise.resolve(result);
      this.inFlight.add(tracked);
      void tracked
        .then(
          () => undefined,
          (error) => {
            logger.error(`❌ Async event handler failed: ${type}`, error);
          },
        )
        .finally(() => {
          this.inFlight.delete(tracked);
        });
    }
  }

  /**
   * 订阅单向事件。
   * @param eventType 事件类型
   * @param handler 监听器函数
   */
  on<K extends keyof TEvents>(eventType: K, handler: (event: TEvents[K]) => void): this {
    if (this.debugEnabled) logger.debug(`👂 On: ${String(eventType)}`);
    this.emitter.on(eventType as string, handler);
    return this;
  }

  /**
   * 移除事件监听器。
   * @param eventType 事件类型
   * @param handler 监听器函数
   */
  off<K extends keyof TEvents>(eventType: K, handler?: (event: TEvents[K]) => void): this {
    if (this.debugEnabled) logger.debug(`🔇 Off: ${String(eventType)}`);
    this.emitter.off(eventType as string, handler);
    return this;
  }

  /**
   * 销毁实例，清空所有监听器。
   */
  destroy(): void {
    if (this.debugEnabled) logger.debug('💥 Destroying EventBus');
    this.emitter.all.clear();
  }

  /**
   * 获取诊断信息。
   */
  getStats() {
    return {
      listenersCount: this.emitter.all.size,
    };
  }

  setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled;
  }
}
