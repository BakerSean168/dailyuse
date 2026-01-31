/**
 * TaskGoalBinding Value Object -  Interface
 * 任务目标绑定值对象 - 服务端接口
 */

import type { GoalId, KeyResultId } from '@/primitives';

// ============ 接口定义 ============

export interface TaskGoalBinding {
  goalId: GoalId;
  keyResultId: KeyResultId;
  goalRecordValue: number;

}

// ============ DTO 定义 ============

export interface TaskGoalBindingDTO {
  goalId: string;
  keyResultId: string;
  goalRecordValue: number;
}

export interface TaskGoalBindingPersistenceDTO {
  goalId: string;
  keyResultId: string;
  goalRecordValue: number;
}
