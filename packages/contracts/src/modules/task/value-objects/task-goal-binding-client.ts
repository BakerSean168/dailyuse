/**
 * TaskGoalBinding Value Object - Client Interface
 * 任务目标绑定值对�?- 客户端接�?
 */

import type { GoalId, KeyResultId } from '@/primitives';
import type { TaskGoalBindingServerDTO } from './task-goal-binding-server';

// ============ 接口定义 ============

export interface TaskGoalBindingClient {
  goalId: GoalId;
  keyResultId: KeyResultId;
  incrementValue: number;

  // UI 辅助属�?
  displayText: string;
  hasPositiveIncrement: boolean;

  equals(other: TaskGoalBindingClient): boolean;
}

// ============ DTO 定义 ============

export interface TaskGoalBindingClientDTO {
  goalId: string;
  keyResultId: string;
  incrementValue: number;
  displayText: string;
  hasPositiveIncrement: boolean;
}
