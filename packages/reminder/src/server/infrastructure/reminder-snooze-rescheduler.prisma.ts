/**
 * R3c：snooze rescheduler 的 Prisma 实现。
 *
 * 语义：用户 snooze 提醒 → 把该 reminder 对应的 schedule task（source_module
 * = 'reminder'，source_entity_id = templateId）的下次触发推迟 duration 秒。
 * 找不到对应任务时记日志（提醒可能已停用/删除），不影响响应记录本身。
 */

import type { PrismaClient } from '@memoflow/database';
import { createLogger } from '@memoflow/utils/logger';
import type { ReminderSnoozeRescheduler } from '../application/use-cases/commands/record-reminder-response.use-case';

const logger = createLogger('ReminderSnoozeRescheduler');

export function createReminderSnoozeReschedulerPrisma(
  db: PrismaClient,
): ReminderSnoozeRescheduler {
  return {
    async reschedule(templateId, identityId, durationSeconds): Promise<void> {
      const nextRunAt = new Date(Date.now() + durationSeconds * 1_000);
      const result = await db.scheduleTask.updateMany({
        where: {
          identityId,
          sourceModule: 'reminder',
          sourceEntityId: templateId,
          enabled: true,
          status: 'Active',
        },
        data: { nextRunAt },
      });
      if (result.count === 0) {
        logger.warn('[ReminderSnooze] No active schedule task found for reminder template', {
          templateId,
          identityId,
        });
        return;
      }
      logger.info('[ReminderSnooze] Reminder rescheduled', {
        templateId,
        nextRunAt: nextRunAt.toISOString(),
        updatedTasks: result.count,
      });
    },
  };
}
