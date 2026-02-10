/**
 * Reminder Domain Services
 * 提醒模块领域服务
 * 
 * 【规范说明：领域服务（Domain Service）】
 * 领域服务是跨聚合根的业务逻辑，使用场景：
 * - 一次操作涉及多个聚合根时
 * - 业务逻辑不属于任何单一聚合根
 * - 无状态类：整个业务逻辑执行后才保存
 * - 注入仓储：需要提供仓储接口
 * 
 * 【业务逻辑服务（推荐使用）】
 * 纯业务逻辑服务（推荐使用）
 */
export { ReminderTemplateBusinessService } from './ReminderTemplateBusinessService';
export type {
  TemplateEffectiveStatus,
  GroupAssignmentValidation,
} from './ReminderTemplateBusinessService';

export { ReminderGroupBusinessService } from './ReminderGroupBusinessService';
export type {
  GroupStatistics,
  GroupDeletionValidation,
  GroupNameValidation,
} from './ReminderGroupBusinessService';

// 即将到来的提醒计算服务
export { UpcomingReminderCalculationService } from './UpcomingReminderCalculationService';
export type { UpcomingReminderDTO } from './UpcomingReminderCalculationService';

// 旧的服务（待废弃）
export { ReminderTemplateControlService } from './ReminderTemplateControlService';
export type { ITemplateEffectiveStatus } from './ReminderTemplateControlService';

export { ReminderTriggerService } from './ReminderTriggerService';
export type { ITriggerReminderParams, ITriggerReminderResult } from './ReminderTriggerService';

export { ReminderSchedulerService } from './ReminderSchedulerService';
export type { IScheduleResult, IScheduleOptions } from './ReminderSchedulerService';

export * from './ReminderDomainService';