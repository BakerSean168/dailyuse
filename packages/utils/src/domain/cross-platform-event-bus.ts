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
 * 跨进程走 `@dailyuse/ipc-client` / HTTP（范式 C）。
 *
 * @see docs/architecture/adr/ADR-033-cross-module-communication-patterns.md
 */
export class CrossPlatformEventBus<TEvents extends EventMap = EventMap> {
  private emitter: Emitter<any>;
  private debugEnabled = false;

  constructor() {
    this.emitter = mitt();
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
  send<K extends keyof TEvents>(eventType: K, payload: TEvents[K]): void {
    const type = eventType as string;
    if (this.debugEnabled) logger.debug(`📤 Send: ${type}`, payload);

    // mitt 内部对同一 key 的 handler 是同步顺序调用；这里取出快照逐个隔离执行，
    // 避免某个订阅者抛错中断后续订阅者（mitt.emit 本身无 per-handler 隔离）。
    const handlers = this.emitter.all.get(type) as Array<Handler<any>> | undefined;
    if (!handlers || handlers.length === 0) return;

    for (const handler of [...handlers]) {
      this.invokeHandler(type, handler, payload);
    }
  }

  private invokeHandler(type: string, handler: Handler<any>, payload: unknown): void {
    try {
      const result = (handler as (event: unknown) => unknown)(payload);
      if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
        void Promise.resolve(result).catch((error) => {
          logger.error(`❌ Async event handler failed: ${type}`, error);
        });
      }
    } catch (error) {
      logger.error(`❌ Event handler failed: ${type}`, error);
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
