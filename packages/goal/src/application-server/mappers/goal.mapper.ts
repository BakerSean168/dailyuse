/**
 * Goal Mapper
 *
 * 负责 Goal 领域对象与 DTO 之间的转换
 */

import { Goal } from '@/domain-server';
import type { GoalClientDTO, GoalServerDTO } from '@dailyuse/contracts/goal';
import { rawDataToGoalState } from '@/infrastructure-server/adapters/prisma/mappers/goal-state-mapper';
import type { RawGoalData } from '@/infrastructure-server/adapters/prisma/mappers/goal-state-mapper';

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
   * 将原始持久化数据转换为领域对象
   */
  static toDomain(raw: RawGoalData): Goal {
    return Goal.load(rawDataToGoalState(raw));
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
