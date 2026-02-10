/**
 * Schedule Application Service
 * @module application-client/schedule
 */
import {
  CreateSchedule,
  ListSchedules,
  GetSchedule,
  UpdateSchedule,
  DeleteSchedule,
} from './services';

export class ScheduleApplicationService {
  async createSchedule(request: any): Promise<any> {
    return CreateSchedule.getInstance().execute(request);
  }
  async listSchedules(): Promise<any[]> {
    return ListSchedules.getInstance().execute();
  }
  async getSchedule(uuid: string): Promise<any> {
    return GetSchedule.getInstance().execute(uuid);
  }
  async updateSchedule(uuid: string, request: any): Promise<any> {
    return UpdateSchedule.getInstance().execute(uuid, request);
  }
  async deleteSchedule(uuid: string): Promise<void> {
    return DeleteSchedule.getInstance().execute(uuid);
  }
}

export const scheduleApplicationService = new ScheduleApplicationService();
