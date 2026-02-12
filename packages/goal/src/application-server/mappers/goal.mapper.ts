/**
 * Goal Mapper
 *
 * 负责 Goal 领域对象与 DTO 之间的转换
 */

import { Goal } from '@/domain-server';
import type { GoalClientDTO, GoalPersistenceDTO } from '@dailyuse/contracts/goal';

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
    return Goal.fromPersistenceDTO(dto);
  }

  /**
   * 将领域对象转换为持久化 DTO
   */
  static toPersistence(goal: Goal): GoalPersistenceDTO {
    return goal.toPersistenceDTO();
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
