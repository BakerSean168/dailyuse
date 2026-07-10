import type { IdentityId, TaskInstanceId, TaskTemplateId } from '../../../../primitives';
import type { TaskGoalBindingDTO } from '../../value-objects/task-goal-binding';

/**
 * task:instance-completed 事件。
 *
 * ADR-033 范式 A：payload 自包含。Task 应用层在发布前把跨模块订阅方
 * （如 Goal）所需的判定信息一次填齐——绑定关系、是否满足触发条件、任务标题——
 * 使订阅方无需回查 Task 的 repository。
 */
export interface TaskInstanceCompletedEvent {
  identityId: IdentityId;
  taskInstanceId: TaskInstanceId;
  taskTemplateId: TaskTemplateId;
  completedAt: number;
  /** 任务标题，供订阅方生成记录备注，避免回查模板。 */
  taskTitle: string;
  /** 模板的目标绑定；未绑定目标时为 null。 */
  goalBinding: TaskGoalBindingDTO | null;
  /**
   * 该模板在「本实例完成后」是否所有相关实例都已完成。
   * 仅用于 progressTrigger = AllInstancesCompleted 的判定；
   * 由 Task 应用层在发布前算好（订阅方不再回查兄弟实例状态）。
   */
  allInstancesCompleted: boolean;
}
