/**
 * Reminder Memory Repository
 *
 * In-memory implementation of IReminderRepository for testing.
 */

import type { IReminderRepository } from '../../ports/reminder-repository.port';

export class ReminderMemoryRepository implements IReminderRepository {
  private reminders = new Map<string, any>();

  async findById(uuid: string): Promise<any | null> {
    return this.reminders.get(uuid) || null;
  }

  async findByAccountUuid(accountUuid: string): Promise<any[]> {
    return Array.from(this.reminders.values()).filter((r) => r.accountUuid === accountUuid);
  }

  async findByGoalUuid(goalUuid: string): Promise<any[]> {
    return Array.from(this.reminders.values()).filter((r) => r.goalUuid === goalUuid);
  }

  async findPendingReminders(beforeTime: Date): Promise<any[]> {
    return Array.from(this.reminders.values()).filter(
      (r) => r.status === 'PENDING' && new Date(r.scheduledTime) <= beforeTime
    );
  }

  async save(reminder: any): Promise<void> {
    this.reminders.set(reminder.uuid, reminder);
  }

  async delete(uuid: string): Promise<void> {
    this.reminders.delete(uuid);
  }

  clear(): void {
    this.reminders.clear();
  }
}
