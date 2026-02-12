import type { IScheduleRepository } from '../../domain-server/repositories/IScheduleRepository';
import { Schedule } from '../../domain-server/aggregates/schedule';
import type { ScheduleClientDTO, ConflictDetectionResult } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleEventApplicationService');

/**
 * Schedule Event Application Service
 * 
 * Responsibilities:
 * - Handle user-facing schedule event CRUD operations
 * - Coordinate domain logic
 * - DTO Conversion
 */
export class ScheduleEventApplicationService {
  constructor(private scheduleRepository: IScheduleRepository) {}

  // ===== CRUD Operations =====

  /**
   * Create Schedule Event
   */
  async createSchedule(params: {
    accountUuid: string;
    title: string;
    startTime: number;
    endTime: number;
    description?: string;
    location?: string;
    priority?: number;
    attendees?: string[];
  }): Promise<ScheduleClientDTO> {
    const schedule = Schedule.create({
      accountUuid: params.accountUuid,
      title: params.title,
      startTime: params.startTime,
      endTime: params.endTime,
      description: params.description,
      location: params.location,
      priority: params.priority,
      attendees: params.attendees,
    });

    await this.scheduleRepository.save(schedule);
    return schedule.toClientDTO();
  }

  /**
   * Update Schedule Event
   */
  async updateSchedule(
    uuid: string,
    params: {
      title?: string;
      startTime?: number;
      endTime?: number;
      description?: string;
      location?: string;
      priority?: number;
      attendees?: string[];
    }
  ): Promise<ScheduleClientDTO> {
    const schedule = await this.scheduleRepository.findByUuid(uuid);
    if (!schedule) {
      throw new Error(`Schedule event ${uuid} not found`);
    }

    if (params.title !== undefined) schedule.updateTitle(params.title);
    
    // Time updates require validation, delegated to domain entity methods
    if (params.startTime !== undefined || params.endTime !== undefined) {
      schedule.reschedule(
        params.startTime ?? schedule.startTime, 
        params.endTime ?? schedule.endTime
      );
    }

    await this.scheduleRepository.save(schedule);
    return schedule.toClientDTO();
  }

  /**
   * Delete Schedule Event
   */
  async deleteSchedule(uuid: string): Promise<void> {
    const schedule = await this.scheduleRepository.findByUuid(uuid);
    if (!schedule) {
      throw new Error(`Schedule event ${uuid} not found`);
    }
    await this.scheduleRepository.deleteByUuid(uuid);
  }

  /**
   * Get Schedule Event
   */
  async getSchedule(uuid: string): Promise<ScheduleClientDTO | null> {
    const schedule = await this.scheduleRepository.findByUuid(uuid);
    return schedule ? schedule.toClientDTO() : null;
  }

  /**
   * Get Schedules by Date Range
   */
  async getSchedulesByRange(
    accountUuid: string,
    startTime: number,
    endTime: number
  ): Promise<ScheduleClientDTO[]> {
    const schedules = await this.scheduleRepository.findByTimeRange(accountUuid, startTime, endTime);
    return schedules.map((s: any) => s.toClientDTO());
  }
}

