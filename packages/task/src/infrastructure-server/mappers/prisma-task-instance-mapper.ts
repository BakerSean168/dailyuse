/**
 * Prisma TaskInstance Mapper
 *
 * Maps between TaskInstance domain aggregate and Prisma model.
 * Handles Date/timestamp conversions for instance dates.
 */

import type { TaskInstance as PrismaTaskInstance } from '@dailyuse/database';
import { TaskInstance } from '../../../domain-server/aggregates/task-instance';

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
      instanceDate: dto.instanceDate instanceof Date ? dto.instanceDate : new Date(dto.instanceDate as any),
      timeConfig: dto.timeConfig || '{}',
      importance: dto.importance || 'Moderate',
      priority: dto.priority ?? null,
      status: dto.status,
      actualStartTime: dto.actualStartTime
        ? (dto.actualStartTime instanceof Date ? dto.actualStartTime : new Date(dto.actualStartTime as any))
        : null,
      actualEndTime: dto.actualEndTime
        ? (dto.actualEndTime instanceof Date ? dto.actualEndTime : new Date(dto.actualEndTime as any))
        : null,
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
