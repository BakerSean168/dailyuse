/**
 * Prisma TaskDependency Mapper
 *
 * Maps between TaskDependency and Prisma model.
 * Returns TaskDependencyServerDTO directly.
 */

import type { TaskDependency as PrismaTaskDependency } from '@dailyuse/database';
import type { TaskDependencyServerDTO, DependencyType } from '@dailyuse/contracts/task';
import type { TaskDependencyId, IdentityId, TaskTemplateId } from '@dailyuse/contracts/primitives';
import { TaskDependency } from '../../../../domain/aggregates/task-dependency';

/** Prisma Date/DateTime → Instant (epoch ms). Required fields never null. */
function requiredInstant(value: Date | string | number | null | undefined): number {
  if (value instanceof Date) return value.getTime();
  if (value == null) return Date.now();
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : Date.now();
}

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
      createdAt: requiredInstant(data.createdAt),
      updatedAt: requiredInstant(data.updatedAt),
    };
  }

  /**
   * Batch conversion: Prisma → DTO
   */
  static toDTOList(rows: PrismaTaskDependency[]): TaskDependencyServerDTO[] {
    return rows.map((row) => PrismaTaskDependencyMapper.toDTO(row));
  }

  /**
   * Prisma record → TaskDependency aggregate
   */
  static toAggregate(data: PrismaTaskDependency): TaskDependency {
    return TaskDependency.load({
      id: data.id as TaskDependencyId,
      identityId: data.identityId as IdentityId,
      predecessorTaskId: data.predecessorTaskId,
      successorTaskId: data.successorTaskId,
      dependencyType: data.dependencyType as DependencyType,
      lagDays: data.lagDays ?? undefined,
      createdAt: requiredInstant(data.createdAt),
      updatedAt: requiredInstant(data.updatedAt),
    });
  }
}
