/**
 * Reminder Repository Port Interface
 *
 * TODO: Move to domain-server when Reminder module is refactored
 */

export interface IReminderRepository {
  findById(uuid: string): Promise<unknown | null>;
  findByAccountUuid(accountUuid: string): Promise<unknown[]>;
  findByGoalUuid(goalUuid: string): Promise<unknown[]>;
  findPendingReminders(beforeTime: Date): Promise<unknown[]>;
  save(reminder: unknown): Promise<void>;
  delete(uuid: string): Promise<void>;
}
