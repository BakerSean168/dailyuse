/**
 * Prisma ReminderResponse Mapper
 *
 * Maps between ReminderResponse domain entity and Prisma model.
 */

import type { ReminderResponse as PrismaReminderResponse } from '@dailyuse/database';
import type { ReminderResponseAction } from '@dailyuse/contracts/reminder';
import { ReminderResponse } from '@/domain-server/entities/reminder-response';
import { ReminderResponseId } from '@/domain-shared/value-objects/reminder-response-id';

export class PrismaReminderResponseMapper {
  /**
   * Prisma record → ReminderResponse entity
   */
  static toDomain(data: PrismaReminderResponse): ReminderResponse {
    return ReminderResponse.load({
      id: ReminderResponseId.of(data.id),
      reminderTemplateId: data.templateId,
      identityId: data.identityId,
      action: data.action as ReminderResponseAction,
      // responseTime is stored as seconds in DB; convert to JS Date (milliseconds)
      responseTime: data.responseTime != null ? new Date(data.responseTime * 1000) : null,
      timestamp: data.timestamp,
    });
  }

  /**
   * Batch conversion: Prisma → Domain
   */
  static toDomainList(rows: PrismaReminderResponse[]): ReminderResponse[] {
    return rows.map((row) => PrismaReminderResponseMapper.toDomain(row));
  }
}
