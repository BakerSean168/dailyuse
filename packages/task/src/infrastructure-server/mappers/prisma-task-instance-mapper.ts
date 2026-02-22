/**
 * Prisma TaskInstance Mapper
 *
 * Maps between TaskInstance domain aggregate and Prisma model.
 * Handles Date/timestamp conversions for instance dates.
 */

import type { TaskInstance as PrismaTaskInstance } from '@dailyuse/database';
import { TaskInstance } from '../../../domain-server/aggregates/task-instance';

/**
 * Safely convert a Date, number (timestamp), or string to a Date object.
 * Returns null if the input is falsy.
 */
function toDate(value: Date | number | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export class PrismaTaskInstanceMapper {
  /**
   * Prisma record → TaskInstance aggregate root
   */
  static toDomain(data: PrismaTaskInstance): TaskInstance {
    return TaskInstance.fromPersistenceDTO({
      id: data.id,
      templateId: data.templateId,
      identityId: data.identityId,
      instanceDate: data.instanceDate,
      timeConfig: data.timeConfig || '{}',
      importance: data.importance || 'Moderate',
      priority: data.priority ?? undefined,
      status: data.status,
      actualStartTime: data.actualStartTime ?? null,
      actualEndTime: data.actualEndTime ?? null,
      comment: data.comment ?? null,
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    });
  }

  /**
   * TaskInstance aggregate → Prisma write data
   */
  static toPersistence(dto: ReturnType<TaskInstance['toPersistenceDTO']>) {
    return {
      templateId: dto.templateId,
      identityId: dto.identityId,
      instanceDate: toDate(dto.instanceDate) ?? new Date(),
      timeConfig: dto.timeConfig || '{}',
      importance: dto.importance || 'Moderate',
      priority: dto.priority ?? null,
      status: dto.status,
      actualStartTime: toDate(dto.actualStartTime),
      actualEndTime: toDate(dto.actualEndTime),
      comment: dto.comment ?? null,
      version: dto.version,
    };
  }

  /**
   * Batch conversion: Prisma → Domain
   */
  static toDomainList(rows: PrismaTaskInstance[]): TaskInstance[] {
    return rows.map((row) => PrismaTaskInstanceMapper.toDomain(row));
  }
}
