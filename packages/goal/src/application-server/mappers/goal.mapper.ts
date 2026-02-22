/**
 * Goal Mapper
 *
 * 负责 Goal 领域对象与 DTO 之间的转换
 */

import { Goal } from '@/domain-server';
import type { GoalClientDTO, GoalPersistenceDTO, GoalServerDTO } from '@dailyuse/contracts/goal';
import { persistenceDtoToGoalState } from '@/infrastructure-server/mappers/goal-state-mapper';

/**
 * Goal Mapper
 */
export class GoalMapper {
  /**
   * 将领域对象转换为客户端 DTO
   */
  static toClientDTO(goal: Goal, includeChildren = false): GoalClientDTO {
    return goal.toClientDTO(includeChildren);
  }

  /**
   * 将持久化 DTO 转换为领域对象
   */
  static toDomain(dto: GoalPersistenceDTO): Goal {
    return Goal.load(persistenceDtoToGoalState(dto));
  }

  /**
   * 将领域对象转换为 Server DTO
   */
  static toServerDTO(goal: Goal, includeChildren = true): GoalServerDTO {
    return goal.toServerDTO(includeChildren);
  }

  /**
   * 批量转换为客户端 DTO
   */
  static toClientDTOList(goals: Goal[], includeChildren = false): GoalClientDTO[] {
    return goals.map((goal) => this.toClientDTO(goal, includeChildren));
  }
}

// Re-export GoalPersistenceDTO type from contracts
export type { GoalPersistenceDTO } from '@dailyuse/contracts/goal';
