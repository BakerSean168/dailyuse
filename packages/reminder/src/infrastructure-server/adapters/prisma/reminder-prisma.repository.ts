/**
 * Reminder Prisma Repository
 *
 * Prisma implementation of IReminderRepository.
 */

import type { IReminderRepository } from '../../ports/reminder-repository.port';

export class ReminderPrismaRepository implements IReminderRepository {
  constructor(private readonly prisma: any) {}

  async findById(uuid: string): Promise<any | null> {
    return this.prisma.reminder.findUnique({ where: { uuid } });
  }

  async findByAccountUuid(accountUuid: string): Promise<any[]> {
    return this.prisma.reminder.findMany({ where: { accountUuid } });
  }

  async findByGoalUuid(goalUuid: string): Promise<any[]> {
    return this.prisma.reminder.findMany({ where: { goalUuid } });
  }

  async findPendingReminders(beforeTime: Date): Promise<any[]> {
    return this.prisma.reminder.findMany({
      where: {
        scheduledTime: { lte: beforeTime },
        status: 'PENDING',
      },
    });
  }

  async save(reminder: any): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.reminder.delete({ where: { uuid } });
  }
}
