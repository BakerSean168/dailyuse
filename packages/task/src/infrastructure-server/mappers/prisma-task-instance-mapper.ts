/**
 * Prisma TaskInstance Mapper
 *
 * Maps between TaskInstance domain aggregate and Prisma model.
 * Handles Date/timestamp conversions for instance dates.
 */

import type { TaskInstance as PrismaTaskInstance } from '@dailyuse/database';
import { TaskInstance } from '@/domain-server/aggregates/task-instance';
import type { TaskInstanceServerDTO } from '@dailyuse/contracts/task';
import { TaskInstanceStatus } from '@dailyuse/contracts/task';
import { TaskInstanceId } from '@/domain-shared/value-objects/task-instance-id';
import { TaskTemplateId } from '@/domain-shared/value-objects/task-template-id';
import { IdentityId } from '@dailyuse/domain-shared';
import { TaskTimeConfig } from '@/domain-server/value-objects';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';

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
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
      deletedAt: data.deletedAt ?? null,
    });
  }

  /**
   * TaskInstance ServerDTO → Prisma write data
   */
  static toPersistence(dto: TaskInstanceServerDTO) {
    return {
      templateId: dto.templateId,
      identityId: dto.identityId,
      instanceDate: toDate(dto.instanceDate) ?? new Date(),
      timeConfig: typeof dto.timeConfig === 'string' ? dto.timeConfig : JSON.stringify(dto.timeConfig) || '{}',
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
