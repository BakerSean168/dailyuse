/**
 * ITaskHandler Interface
 *
 * 任务处理器接口
 * Application 层的服务类必须实现此接口以支持调度执行
 * 定义了调度器与业务逻辑之间的契约
 */
export interface ITaskHandler {
  /**
   * 执行任务
   *
   * @param taskId - 任务 ID (UUID)
   * @param context - 执行上下文（可选），可用于传递额外参数
   *
   * @throws 任何异常都会被调度器捕获并记录
   *
   * @example
   * ```typescript
   * const executor = new ScheduleTaskExecutor();
   * await executor.execute('task-123');
   * ```
   */
  execute(taskId: string, context?: unknown): Promise<void>;
}
