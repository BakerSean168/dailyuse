import type { ITaskHandler } from './i-task-handler';

/**
 * IScheduler Interface
 *
 * 调度器接口
 * 所有具体的调度器实现（BreeScheduler、CronScheduler、IntervalScheduler）
 * 都必须实现此接口，确保一致的 API
 *
 * 实现者：
 * - BreeScheduler（推荐，支持 Worker）
 * - CronScheduler（轻量级，基于 node-cron）
 * - IntervalScheduler（简单场景，基于 setInterval）
 */
export interface IScheduler {
  /**
   * 注册任务
   *
   * @param taskId - 任务的唯一标识符（通常为 UUID）
   * @param schedule - 调度配置
   *   - 字符串: Cron 表达式（例如 "0 * * * *" 表示每小时）
   *   - 数字: 间隔毫秒数（例如 60000 表示每分钟）
   * @param handler - 任务处理器实例，任务触发时调用其 execute 方法
   *
   * @throws 如果任务已注册或注册参数无效时抛出错误
   *
   * @example
   * ```typescript
   * const scheduler = new BreeScheduler();
   * const handler = new ScheduleTaskExecutor();
   *
   * // 使用 Cron 表达式
   * await scheduler.register('task-1', '0 * * * *', handler);
   *
   * // 使用间隔毫秒数
   * await scheduler.register('task-2', 60000, handler);
   * ```
   */
  register(taskId: string, schedule: string | number, handler: ITaskHandler): Promise<void>;

  /**
   * 注销任务
   *
   * @param taskId - 要注销的任务 ID
   *
   * @throws 如果任务不存在时抛出错误
   *
   * @example
   * ```typescript
   * await scheduler.unregister('task-1');
   * ```
   */
  unregister(taskId: string): Promise<void>;

  /**
   * 启动调度器
   *
   * 启动后，所有已注册的任务将按照其调度配置开始运行
   *
   * @throws 调度器启动失败时抛出错误
   *
   * @example
   * ```typescript
   * await scheduler.start();
   * console.log('调度器已启动');
   * ```
   */
  start(): Promise<void>;

  /**
   * 停止调度器
   *
   * 停止后，所有任务将暂停运行
   *
   * @throws 调度器停止失败时抛出错误
   *
   * @example
   * ```typescript
   * await scheduler.stop();
   * console.log('调度器已停止');
   * ```
   */
  stop(): Promise<void>;

  /**
   * 获取所有已注册的任务 ID
   *
   * @returns 任务 ID 数组
   *
   * @example
   * ```typescript
   * const tasks = scheduler.getRegisteredTasks();
   * console.log(`已注册 ${tasks.length} 个任务`);
   * ```
   */
  getRegisteredTasks(): string[];

  /**
   * 检查任务是否已注册
   *
   * @param taskId - 任务 ID
   * @returns true 如果任务已注册，否则 false
   *
   * @example
   * ```typescript
   * if (scheduler.isRegistered('task-1')) {
   *   console.log('任务已注册');
   * }
   * ```
   */
  isRegistered(taskId: string): boolean;
}
