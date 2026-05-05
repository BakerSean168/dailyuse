/**
 * Prisma TaskDependency Mapper
 *
 * Maps between TaskDependency and Prisma model.
 * Returns TaskDependencyServerDTO directly.
 */

import type { TaskDependency as PrismaTaskDependency } from '@dailyuse/database';
import type { TaskDependencyServerDTO, DependencyType } from '@dailyuse/contracts/task';
import type { TaskDependencyId, IdentityId, TaskTemplateId } from '@dailyuse/contracts/primitives';

export class PrismaTaskDependencyMapper {
  /**
   * Prisma record → TaskDependencyServerDTO
   */
  static toDTO(data: PrismaTaskDependency): TaskDependencyServerDTO {
    return {
      id: data.id as TaskDependencyId,
      identityId: data.identityId as IdentityId,
      predecessorTaskId: data.predecessorTaskId as TaskTemplateId,
      successorTaskId: data.successorTaskId as TaskTemplateId,
      dependencyType: data.dependencyType as DependencyType,
      lagDays: data.lagDays ?? undefined,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
    };
  }

  /**
   * Batch conversion: Prisma → DTO
   */
  static toDTOList(rows: PrismaTaskDependency[]): TaskDependencyServerDTO[] {
    return rows.map((row) => PrismaTaskDependencyMapper.toDTO(row));
  }
}
