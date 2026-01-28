import { CrossPlatformEventBus } from './cross-platform-event-bus';
import type { AppEventRegistry, AppRpcRegistry } from '@dailyuse/contracts/shared';

// ===================== 2. 全局事件总线类 =====================

/**
 * 全局事件总线 (具体业务实现)
 * 继承自 CrossPlatformEventBus 并注入具体的 AppEvents 和 AppRpc 泛型
 */
export class GlobalEventBus extends CrossPlatformEventBus<AppEventRegistry, AppRpcRegistry> {
  private static instance: GlobalEventBus | null = null;

  private constructor() {
    super();
    // 可以在这里进行全局初始化配置
    this.setDebugMode(process.env.NODE_ENV === 'development');
    console.log('🚀 GlobalEventBus initialized with strong typing');
  }

  /**
   * 获取单例
   */
  static getInstance(): GlobalEventBus {
    if (!GlobalEventBus.instance) {
      GlobalEventBus.instance = new GlobalEventBus();
    }
    return GlobalEventBus.instance;
  }

  /**
   * 重置单例 (仅用于测试环境)
   */
  static resetInstance(): void {
    if (GlobalEventBus.instance) {
      GlobalEventBus.instance.destroy();
      GlobalEventBus.instance = null;
    }
  }

}

// ===================== 4. 导出单例 =====================

/**
 * 全局唯一的事件总线实例
 * * 使用示例:
 * 1. 发送事件: eventBus.send('user:login', { userId: '1', timestamp: Date.now() })
 * 2. 监听事件: eventBus.on('user:login', (e) => console.log(e.userId))
 * 3. 发起请求: const result = await eventBus.invoke('account:check-email', { email: 'a@b.com' })
 */
export const eventBus = GlobalEventBus.getInstance();
