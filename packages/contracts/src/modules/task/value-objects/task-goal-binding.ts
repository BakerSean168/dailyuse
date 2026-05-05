/**
 * TaskGoalBinding Value Object -  Interface
 * 任务目标绑定值对象 - 服务端接口
 */

import type { GoalId, KeyResultId } from '../../../primitives';
import type { TaskGoalBindingTrigger } from './task-goal-binding-trigger';

// ============ 接口定义 ============

export interface TaskGoalBinding {
  goalId: GoalId;
  keyResultId: KeyResultId;
  goalRecordValue: number;
  progressTrigger: TaskGoalBindingTrigger;
}

// ============ DTO 定义 ============

export interface TaskGoalBindingDTO {
  goalId: string;
  keyResultId: string;
  goalRecordValue: number;
  progressTrigger: TaskGoalBindingTrigger;
}

