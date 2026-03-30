import mitt, { type Emitter, type Handler } from 'mitt';
import { createLogger } from '../logger';
import { generateUUID } from '../shared/uuid';

// 基础类型约束
type EventMap = Record<string, any>;
type RpcMap = Record<string, [any, any]>;

const logger = createLogger('CrossPlatformEventBus');

/**
 * 跨平台统一事件系统
 * 基于 mitt 实现，支持浏览器和 Node.js 环境
 * 提供单向通信（send/on）和双向通信（invoke/handle）
 * 类似 Electron IPC 的接口设计
 */
export class CrossPlatformEventBus<
  TEvents extends EventMap = EventMap, 
  TRpc extends RpcMap = RpcMap
> {
  private emitter: Emitter<any>;
  private rpcListeners = new Map<string, Handler<any>>();
  private debugEnabled = false;
  private defaultTimeout = 30000; // 30秒默认超时
  private pendingRequests = new Map<string, any>(); // 使用 any 替代 NodeJS.Timeout
  private handlers = new Map<string, (payload: any) => Promise<any> | any>();

  constructor() {
    this.emitter = mitt();
  }

  // ===================== 单向通信 (send/on) =====================

  /**
   * 发送单向事件（类似 Electron 的 ipcRenderer.send）
   * 这里的 key 是 TEvents 的键，payload 是对应的值
   * @param eventType 事件类型
   * @param payload 事件负载
   */
  send<K extends keyof TEvents>(eventType: K, payload: TEvents[K]): void {
    logger.info(`📤 Send: ${String(eventType)}`, payload);
    this.emitter.emit(eventType as string, payload);
  }

  /**
   * 监听单向事件（类似 Electron 的 ipcRenderer.on）
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  on<K extends keyof TEvents>(eventType: K, handler: (event: TEvents[K]) => void): this {
    logger.info(`👂 On: ${String(eventType)}`);
    this.emitter.on(eventType as string, handler);
    return this;
  }

  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  off<K extends keyof TEvents>(eventType: K, handler?: (event: TEvents[K]) => void): this {
    logger.info(`🔇 Off: ${String(eventType)}`);
    this.emitter.off(eventType as string, handler);
    return this;
  }

  // ===================== 双向通信 (invoke/handle) =====================

  /**
   * 注册请求处理器（类似 Electron 的 ipcMain.handle）
   * @param requestType 请求类型
   * @param handler 处理函数
   */
  handle<K extends keyof TRpc>(
    requestType: K,
    handler: (payload: TRpc[K][0]) => Promise<TRpc[K][1]> | TRpc[K][1],
  ): void {
    const typeStr = requestType as string;
    const requestEventName = `${typeStr}:request`;

    logger.info(`🔧 Register Handler: ${typeStr}`);

    // 1. 防止重复注册：如果已存在，先卸载旧的
    if (this.rpcListeners.has(typeStr)) {
      logger.warn(`⚠️ Overwriting existing handler for: ${typeStr}`);
      this.removeHandler(requestType);
    }

    // 2. 创建包装器：处理请求 -> 执行业务逻辑 -> 发回响应
    const listener: Handler<any> = async (event: { requestId: string; payload: any }) => {
      const { requestId, payload } = event;
      const responseEvent = `${typeStr}:response:${requestId}`;

      try {
        if (this.debugEnabled) logger.info(`📥 Handle Request: ${typeStr} (${requestId})`);
        
        // 执行业务逻辑
        const result = await handler(payload);

        // 发送成功响应
        this.emitter.emit(responseEvent, {
          success: true,
          data: result,
          error: null,
        });
      } catch (error) {
        // 发送错误响应
        logger.error(`❌ Handle Error: ${typeStr} (${requestId})`, error);
        this.emitter.emit(responseEvent, {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // 3. 存储引用并注册
    this.rpcListeners.set(typeStr, listener);
    this.emitter.on(requestEventName, listener);
  }

  /**
   * 移除 RPC 请求处理器
   * @param requestType 请求类型
   * * ⚠️ 优化点：使用存储的函数引用进行 off，确保真正移除
   */
  removeHandler<K extends keyof TRpc>(requestType: K): void {
    const typeStr = requestType as string;
    const requestEventName = `${typeStr}:request`;

    const listener = this.rpcListeners.get(typeStr);
    if (listener) {
      logger.info(`🗑️ Remove Handler: ${typeStr}`);
      this.emitter.off(requestEventName, listener);
      this.rpcListeners.delete(typeStr);
    }
  }

  /**
   * 发送请求并等待响应（类似 Electron 的 ipcRenderer.invoke）
   * @param requestType 请求类型
   * @param payload 请求载荷
   * @param options 选项
   */
  async invoke<K extends keyof TRpc>(
    requestType: K,
    payload: TRpc[K][0],
    options?: { timeout?: number },
  ): Promise<TRpc[K][1]> {
    const typeStr = requestType as string;
    const requestId = generateUUID();
    const timeout = options?.timeout || this.defaultTimeout;
    const responseEvent = `${typeStr}:response:${requestId}`;
    const requestEvent = `${typeStr}:request`;

    if (this.debugEnabled) logger.info(`📨 Invoke: ${typeStr} (${requestId})`);

    return new Promise((resolve, reject) => {
      // 清理函数：无论成功失败都要执行
      const cleanup = () => {
        clearTimeout(timer);
        this.emitter.off(responseEvent, responseHandler);
        this.pendingRequests.delete(requestId);
      };

      // 1. 设置超时
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`RPC Timeout: ${typeStr} (${timeout}ms)`));
      }, timeout);

      // 2. 存储 Pending 状态 (用于 destroy 时取消)
      this.pendingRequests.set(requestId, { reject, timer });

      // 3. 响应处理器
      const responseHandler = (response: {
        success: boolean;
        data: any;
        error: string | null;
      }) => {
        cleanup(); // 收到响应立即清理

        if (response.success) {
          if (this.debugEnabled) logger.info(`✅ Invoke Success: ${typeStr} (${requestId})`);
          resolve(response.data);
        } else {
          logger.error(`❌ Invoke Failed: ${typeStr} (${requestId}) - ${response.error}`);
          reject(new Error(response.error || 'Unknown RPC error'));
        }
      };

      // 4. 监听响应并发送请求
      this.emitter.on(responseEvent, responseHandler);
      this.emitter.emit(requestEvent, { requestId, payload });
    });
  }

  // ===================== 生命周期与维护 =====================

  /**
   * 清理所有等待中的请求
   */
  clearPendingRequests(): void {
    logger.info(`🧹 Clearing ${this.pendingRequests.size} pending requests`);

    for (const [requestId, { reject, timer }] of this.pendingRequests.entries()) {
      clearTimeout(timer);
      reject(new Error('EventBus destroyed: Request cancelled'));
    }
    this.pendingRequests.clear();
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    logger.info(`💥 Destroying EventBus`);
    this.clearPendingRequests();
    this.rpcListeners.clear();
    this.emitter.all.clear();
  }

  /**
   * 获取诊断信息
   */
  getStats() {
    return {
      handlersCount: this.rpcListeners.size,
      listenersCount: this.emitter.all.size,
      pendingRequestsCount: this.pendingRequests.size,
      registeredHandlers: Array.from(this.rpcListeners.keys()),
    };
  }

  setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled;
  }
}
