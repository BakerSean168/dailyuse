import { CrossPlatformEventBus } from './cross-platform-event-bus';
import type { AppEventRegistry } from '@dailyuse/contracts/shared';

// ===================== 全局事件总线 =====================

/**
 * 全局事件总线（具体业务实现）
 * 继承自 CrossPlatformEventBus 并注入具体的 AppEventRegistry 泛型。
 */
export class GlobalEventBus extends CrossPlatformEventBus<AppEventRegistry> {
  constructor() {
    super();
    this.setDebugMode(process.env.NODE_ENV === 'development');
  }
}

/**
 * 全局唯一的事件总线实例。
 *
 * 使用示例（ADR-033 范式 A · 通知式反应）:
 * 1. 发布事件: eventBus.send('user:login', { userId: '1', timestamp: Date.now() })
 * 2. 订阅事件: eventBus.on('user:login', (e) => console.log(e.userId))
 *
 * 需要请求-响应（拿返回值）请走 Port（同进程）或 @dailyuse/ipc-client / HTTP（跨进程），
 * 不要在事件总线上做 RPC。
 */
export const eventBus = new GlobalEventBus();
