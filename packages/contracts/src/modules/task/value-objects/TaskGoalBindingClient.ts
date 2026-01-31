/**
 * TaskGoalBinding Value Object - Client Interface
 * 任务目标绑定值对象 - 客户端接口
 */

import type { TaskGoalBindingServerDTO } from './TaskGoalBindingServer';

// ============ 接口定义 ============

export interface TaskGoalBindingClient {
  goalUuid: string;
  keyResultUuid: string;
  incrementValue: number;

  // UI 辅助属性
  displayText: string;
  hasPositiveIncrement: boolean;

  equals(other: TaskGoalBindingClient): boolean;}

// ============ DTO 定义 ============

export interface TaskGoalBindingClientDTO {
  goalUuid: string;
  keyResultUuid: string;
  incrementValue: number;
  displayText: string;
  hasPositiveIncrement: boolean;
}
