/**
 * TaskGoalBinding Value Object - Server Interface
 * 任务目标绑定值对象 - 服务端接口
 */

import type { TaskGoalBindingClientDTO } from './TaskGoalBindingClient';

// ============ 接口定义 ============

export interface TaskGoalBindingServer {
  goalUuid: string;
  keyResultUuid: string;
  incrementValue: number;

  equals(other: TaskGoalBindingServer): boolean;}

// ============ DTO 定义 ============

export interface TaskGoalBindingServerDTO {
  goalUuid: string;
  keyResultUuid: string;
  incrementValue: number;
}

export interface TaskGoalBindingPersistenceDTO {
  goalUuid: string;
  keyResultUuid: string;
  incrementValue: number;
}
