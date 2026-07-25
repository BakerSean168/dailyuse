/**
 * TaskGoalBinding Value Object -  Interface
 * 任务目标绑定值对象 - 服务端接口
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { GoalId, KeyResultId } from '../../../primitives';
import { TaskGoalBindingTrigger } from './task-goal-binding-trigger';

// ============ 接口定义 ============

export interface TaskGoalBinding {
  goalId: GoalId;
  keyResultId: KeyResultId;
  goalRecordValue: number;
  progressTrigger: TaskGoalBindingTrigger;
}

// Residual 739: TaskGoalBindingDTO dual body retired — OpenAPI + transport use
// TaskGoalBindingSchema (semantic type is a z.infer alias).

export const TaskGoalBindingSchema = z.object({
  goalId: brandedId<GoalId>(),
  keyResultId: brandedId<KeyResultId>(),
  goalRecordValue: z.number().nonnegative(),
  progressTrigger: z.enum(TaskGoalBindingTrigger).default(TaskGoalBindingTrigger.PerInstance),
});

export type TaskGoalBindingDTO = z.infer<typeof TaskGoalBindingSchema>;
