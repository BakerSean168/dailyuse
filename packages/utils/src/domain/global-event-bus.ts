import { CrossPlatformEventBus } from './cross-platform-event-bus';
import type { AppEventRegistry, AppRpcRegistry } from '@dailyuse/contracts/shared';

// ===================== 2. 全局事件总线类 =====================

/**
 * 全局事件总线 (具体业务实现)
 * 继承自 CrossPlatformEventBus 并注入具体的 AppEvents 和 AppRpc 泛型
 */
export class GlobalEventBus extends CrossPlatformEventBus<AppEventRegistry, AppRpcRegistry> {
  constructor() {
    super();
    this.setDebugMode(process.env.NODE_ENV === 'development');
  }
}

/**
 * 全局唯一的事件总线实例
 * * 使用示例:
 * 1. 发送事件: eventBus.send('user:login', { userId: '1', timestamp: Date.now() })
 * 2. 监听事件: eventBus.on('user:login', (e) => console.log(e.userId))
 * 3. 发起请求: const result = await eventBus.invoke('account:check-email', { email: 'a@b.com' })
 */
export const eventBus = new GlobalEventBus();
