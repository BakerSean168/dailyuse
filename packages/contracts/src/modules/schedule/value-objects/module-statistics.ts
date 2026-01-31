/**
 * Module Statistics Value Object
 * 模块统计值对�?
 */

// ============ 接口定义 ============

/**
 * 模块统计 - Server 接口
 */
export interface IModuleStatisticsServer {
  /** 模块名称 */
  moduleName: string;

  /** 总任务数 */
  totalTasks: number;

  /** 活跃任务�?*/
  activeTasks: number;

  /** 总执行次�?*/
  totalExecutions: number;

  /** 成功执行次数 */
  successfulExecutions: number;

  /** 失败执行次数 */
  failedExecutions: number;

  /** 平均执行时长（毫秒） */
  avgDuration: number;

  // 值对象方�?
  with(
    updates: Partial<
      Omit<
        IModuleStatisticsServer,
        | 'equals'
        | 'with'
        | 'update'
        | 'calculateSuccessRate'
        | 'toServerDTO'
        | 'toClientDTO'
        | 'toPersistenceDTO'
      >
    >,
  ): IModuleStatisticsServer;
  update(
    tasksDelta: number,
    activeTasksDelta: number,
    executionsDelta: number,
    successDelta: number,
    failureDelta: number,
    durationMs: number,
  ): IModuleStatisticsServer;

  // DTO 转换方法
}

/**
 * 模块统计 - Client 接口
 */
export interface IModuleStatisticsClient {
  /** 模块名称 */
  moduleName: string;

  /** 总任务数 */
  totalTasks: number;

  /** 活跃任务�?*/
  activeTasks: number;

  /** 总执行次�?*/
  totalExecutions: number;

  /** 成功�?*/
  successRate: number;

  /** 平均执行时长 */
  avgDuration: number;

  // UI 辅助属�?
  /** 模块显示名称 */
  moduleDisplayName: string; // "提醒模块" | "任务模块"

  /** 成功率格式化 */
  successRateFormatted: string; // "98.5%"

  /** 成功率颜�?*/
  successRateColor: string; // "green" | "yellow" | "red"

  /** 平均时长格式�?*/
  avgDurationFormatted: string; // "1.2 �?

  /** 活跃任务比例 */
  activeTasksRatio: string; // "80/100"

  // 值对象方�?

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * Module Statistics Server DTO
 */
export interface ModuleStatisticsServerDTO {
  moduleName: string;
  totalTasks: number;
  activeTasks: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgDuration: number;
}

/**
 * Module Statistics Client DTO
 */
export interface ModuleStatisticsClientDTO {
  moduleName: string;
  totalTasks: number;
  activeTasks: number;
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  moduleDisplayName: string;
  successRateFormatted: string;
  successRateColor: string;
  avgDurationFormatted: string;
  activeTasksRatio: string;
}

/**
 * Module Statistics Persistence DTO
 */
export interface ModuleStatisticsPersistenceDTO {
  module_name: string;
  totalTasks: number;
  activeTasks: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avg_duration: number;
}

// ============ 类型导出 ============

export type ModuleStatisticsServer = IModuleStatisticsServer;
export type ModuleStatisticsClient = IModuleStatisticsClient;
