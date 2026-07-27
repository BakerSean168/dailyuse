/**
 * Prisma TaskInstance Mapper
 *
 * Maps between TaskInstance domain aggregate and Prisma model.
 * Handles Date/timestamp conversions for instance dates.
 */

import type { TaskInstance as PrismaTaskInstance } from '@dailyuse/database';
import { toDateOrNull } from '@dailyuse/utils/shared';
import { TaskInstance } from '../../../../domain/aggregates/task-instance';
import { TaskInstanceStatus } from '@dailyuse/contracts/task';
import { TaskInstanceId } from '../../../../domain/value-objects/task-instance-id';
import { TaskTemplateId } from '../../../../domain/value-objects/task-template-id';
import { IdentityId } from '@dailyuse/domain-shared';
import { TaskTimeConfig } from '../../../../domain/value-objects';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';

/** Prisma Date/DateTime → Instant (epoch ms). Required fields never null. */
function requiredInstant(value: Date | string | number | null | undefined): number {
  if (value instanceof Date) return value.getTime();
  if (value == null) return Date.now();
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : Date.now();
}

/** Prisma Date/DateTime → Instant | null. */
function optionalInstant(value: Date | string | number | null | undefined): number | null {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}


export class PrismaTaskInstanceMapper {
  /**
   * Prisma record → TaskInstance aggregate root
   */
  static toDomain(data: PrismaTaskInstance): TaskInstance {
    return TaskInstance.load({
      id: TaskInstanceId.of(data.id),
      templateId: TaskTemplateId.of(data.templateId),
      identityId: IdentityId.of(data.identityId),
      instanceDate: data.instanceDate.getTime(),
      timeConfig: TaskTimeConfig.fromDTO(JSON.parse(data.timeConfig || '{}')),
      importance: (data.importance || 'Moderate') as ImportanceLevel,
      priority: data.priority ?? undefined,
      status: data.status as TaskInstanceStatus,
      completionRecord: null,
      skipRecord: null,
      actualStartTime: data.actualStartTime?.getTime() ?? null,
      actualEndTime: data.actualEndTime?.getTime() ?? null,
      note: data.comment ?? null,
      version: data.version,
      createdAt: requiredInstant(data.createdAt),
      updatedAt: requiredInstant(data.updatedAt),
      deletedAt: optionalInstant(data.deletedAt),
    });
  }

  /**
   * TaskInstance 聚合根 → Prisma write data
   */
  static toPersistence(instance: TaskInstance) {
    const dto = instance.toServerDTO();
    return {
      templateId: dto.templateId,
      identityId: dto.identityId,
      instanceDate: toDateOrNull(dto.instanceDate) ?? new Date(),
      timeConfig: typeof dto.timeConfig === 'string' ? dto.timeConfig : JSON.stringify(dto.timeConfig) || '{}',
      importance: dto.importance || 'Moderate',
      priority: dto.priority ?? null,
      status: dto.status,
      actualStartTime: toDateOrNull(dto.actualStartTime),
      actualEndTime: toDateOrNull(dto.actualEndTime),
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
