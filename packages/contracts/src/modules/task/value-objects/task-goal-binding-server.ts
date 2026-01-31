/**
 * TaskGoalBinding Value Object - Server Interface
 * 任务目标绑定值对�?- 服务端接�?
 */

import type { GoalId, KeyResultId } from '@/primitives';
import type { TaskGoalBindingClientDTO } from './task-goal-binding-client';

// ============ 接口定义 ============

export interface TaskGoalBindingServer {
  goalId: GoalId;
  keyResultId: KeyResultId;
  incrementValue: number;

  equals(other: TaskGoalBindingServer): boolean;
}

// ============ DTO 定义 ============

export interface TaskGoalBindingServerDTO {
  goalId: string;
  keyResultId: string;
  incrementValue: number;
}

export interface TaskGoalBindingPersistenceDTO {
  goalId: string;
  keyResultId: string;
  incrementValue: number;
}
