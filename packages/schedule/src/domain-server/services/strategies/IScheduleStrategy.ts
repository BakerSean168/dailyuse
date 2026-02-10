/**
 * 调度策略接口
 * 
 * 职责：
 * - 定义如何从源实体创建调度任务的契约
 * - 每个源模块（Goal/Task/Reminder）有自己的策略实现
 * - 封装业务规则到 cron 表达式的转换逻辑
 */

import { SourceModule } from '@dailyuse/contracts/schedule';
import type { ScheduleConfig } from '../../value-objects/ScheduleConfig';
import type { TaskMetadata } from '../../value-objects/TaskMetadata';

/**
 * 调度策略输入数据
 */
export interface ScheduleStrategyInput {
  identityId: string;
  sourceModule: SourceModule;
  sourceEntityId: string;
  sourceEntity: any; // 源实体的完整数据
}

/**
 * 调度策略输出结果
 */
export interface ScheduleStrategyOutput {
  name: string;
  description: string | null;
  scheduleConfig: ScheduleConfig;
  metadata: TaskMetadata;
  enabled: boolean;
}

/**
 * 调度策略接口
 */
export interface IScheduleStrategy {
  /**
   * 判断是否支持该源模块
   */
  supports(sourceModule: SourceModule): boolean;

  /**
   * 判断源实体是否需要创建调度任务
   * 例如：Goal 只有设置了 reminderConfig 才需要调度
   */
  shouldCreateSchedule(sourceEntity: any): boolean;

  /**
   * 从源实体创建调度配置
   * 
   * @throws Error 如果无法创建有效的调度配置
   */
  createSchedule(input: ScheduleStrategyInput): ScheduleStrategyOutput;

  /**
   * 更新现有调度任务（可选）
   * 当源实体更新时调用
   */
  updateSchedule?(
    existingSchedule: ScheduleStrategyOutput,
    input: ScheduleStrategyInput,
  ): ScheduleStrategyOutput;
}
