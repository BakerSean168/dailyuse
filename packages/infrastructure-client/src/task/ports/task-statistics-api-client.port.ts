/**
 * Task Statistics API Client Port
 *
 * 定义任务统计 API 客户端接口。
 * 使用依赖注入模式，适配器在运行时注入。
 */

/**
 * 任务统计 DTO（合约包暂未定义，临时本地声明）
 */
export interface TaskStatisticsServerDTO {
  accountUuid: string;
  totalTemplates: number;
  totalInstances: number;
  completedToday: number;
  completedThisWeek: number;
  completionRate: number;
  efficiencyTrend: 'UP' | 'DOWN' | 'STABLE';
  updatedAt: string;
}

/**
 * ITaskStatisticsApiClient
 *
 * 任务统计 API 客户端接口
 */
export interface ITaskStatisticsApiClient {
  // ===== Task Statistics 查询 =====

  /**
   * 获取任务统计数据
   */
  getTaskStatistics(
    accountUuid: string,
    forceRecalculate?: boolean,
  ): Promise<TaskStatisticsServerDTO>;

  /**
   * 重新计算任务统计
   */
  recalculateTaskStatistics(
    accountUuid: string,
    force?: boolean,
  ): Promise<TaskStatisticsServerDTO>;

  /**
   * 删除统计数据
   */
  deleteTaskStatistics(accountUuid: string): Promise<void>;

  // ===== 部分更新操作 =====

  /**
   * 更新模板统计信息
   */
  updateTemplateStats(accountUuid: string): Promise<void>;

  /**
   * 更新实例统计信息
   */
  updateInstanceStats(accountUuid: string): Promise<void>;

  /**
   * 更新完成统计信息
   */
  updateCompletionStats(accountUuid: string): Promise<void>;

  // ===== 快速查询方法 =====

  /**
   * 获取今日完成率
   */
  getTodayCompletionRate(accountUuid: string): Promise<number>;

  /**
   * 获取本周完成率
   */
  getWeekCompletionRate(accountUuid: string): Promise<number>;

  /**
   * 获取效率趋势
   */
  getEfficiencyTrend(accountUuid: string): Promise<'UP' | 'DOWN' | 'STABLE'>;
}
