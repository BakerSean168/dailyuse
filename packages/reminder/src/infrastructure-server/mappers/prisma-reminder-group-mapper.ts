/**
 * Prisma ReminderGroup Mapper
 *
 * Maps between ReminderGroup domain aggregate and Prisma model.
 * Handles JSON serialization for stats field.
 */

import type { ReminderGroup as PrismaReminderGroup } from '@dailyuse/database';
import type { ControlMode, ReminderStatus, GroupStatsServerDTO } from '@dailyuse/contracts/reminder';
import { ReminderGroup } from '../../../domain-server/aggregates/reminder-group';

export class PrismaReminderGroupMapper {
  /**
   * Prisma record → ReminderGroup aggregate root
   */
  static toDomain(data: PrismaReminderGroup): ReminderGroup {
    return ReminderGroup.fromPersistenceDTO({
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? null,
      icon: data.icon ?? null,
      controlMode: data.controlMode as ControlMode,
      enabled: data.enabled,
      status: data.status as ReminderStatus,
      order: data.order,
      stats: data.stats
        ? (JSON.parse(data.stats) as GroupStatsServerDTO)
        : {
            totalTemplates: 0,
            activeTemplates: 0,
            pausedTemplates: 0,
            selfEnabledTemplates: 0,
            selfPausedTemplates: 0,
          },
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    });
  }

  /**
   * ReminderGroup aggregate → Prisma write data
   */
  static toPersistence(group: ReminderGroup) {
    const dto = group.toPersistenceDTO();
    return {
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      icon: dto.icon,
      controlMode: dto.controlMode,
      enabled: dto.enabled,
      status: dto.status,
      order: dto.order,
      stats: JSON.stringify(dto.stats),
      version: dto.version,
      deletedAt: dto.deletedAt,
    };
  }

  /**
   * Batch conversion: Prisma → Domain
   */
  static toDomainList(rows: PrismaReminderGroup[]): ReminderGroup[] {
    return rows.map((row) => PrismaReminderGroupMapper.toDomain(row));
  }
}
