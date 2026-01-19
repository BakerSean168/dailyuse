/**
 * Reminder Application Service
 * @module application-client/reminder
 */
import {
  CreateReminder,
  ListReminders,
  GetReminder,
  UpdateReminder,
  DeleteReminder,
  SnoozeReminder,
  DismissReminder,
} from './services';

export class ReminderApplicationService {
  async createReminder(request: any): Promise<any> {
    return CreateReminder.getInstance().execute(request);
  }
  async listReminders(): Promise<any[]> {
    return ListReminders.getInstance().execute();
  }
  async getReminder(uuid: string): Promise<any> {
    return GetReminder.getInstance().execute(uuid);
  }
  async updateReminder(uuid: string, request: any): Promise<any> {
    return UpdateReminder.getInstance().execute(uuid, request);
  }
  async deleteReminder(uuid: string): Promise<void> {
    return DeleteReminder.getInstance().execute(uuid);
  }
  async snoozeReminder(uuid: string, minutes: number): Promise<void> {
    return SnoozeReminder.getInstance().execute(uuid, minutes);
  }
  async dismissReminder(uuid: string): Promise<void> {
    return DismissReminder.getInstance().execute(uuid);
  }
}

export const reminderApplicationService = new ReminderApplicationService();
