import type { IScheduleRepository } from '@dailyuse/domain-server/schedule';
import { Schedule } from '@dailyuse/domain-server/schedule';
import type { ScheduleClientDTO, ConflictDetectionResult, EventPriority, RecurrenceRule } from '@dailyuse/contracts/schedule';
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
    isAllDay?: boolean;
    location?: string;
    recurrenceRule?: RecurrenceRule;
    priority?: EventPriority;
    color?: string;
    timezone?: string;
    reminders?: any[];
    tags?: string[];
  }): Promise<ScheduleClientDTO> {
    const schedule = Schedule.create({
      accountUuid: params.accountUuid,
      title: params.title,
      startTime: params.startTime,
      endTime: params.endTime,
      description: params.description,
      isAllDay: params.isAllDay,
      location: params.location,
      recurrenceRule: params.recurrenceRule,
      priority: params.priority,
      color: params.color,
      timezone: params.timezone,
      reminders: params.reminders,
      tags: params.tags,
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
      isAllDay?: boolean;
      location?: string;
      recurrenceRule?: RecurrenceRule;
      priority?: EventPriority;
      color?: string;
      timezone?: string;
      reminders?: any[];
      tags?: string[];
    }
  ): Promise<ScheduleClientDTO> {
    const schedule = await this.scheduleRepository.findByUuid(uuid);
    if (!schedule) {
      throw new Error(`Schedule event ${uuid} not found`);
    }

    if (params.title !== undefined) schedule.updateTitle(params.title);
    if (params.description !== undefined) schedule.description = params.description;
    
    // Time updates usually require validation, delegated to domain entity methods ideally
    if (params.startTime !== undefined || params.endTime !== undefined) {
      schedule.reschedule(
          params.startTime ?? schedule.startTime, 
          params.endTime ?? schedule.endTime
      );
    }

    if (params.isAllDay !== undefined) schedule.isAllDay = params.isAllDay;
    if (params.location !== undefined) schedule.location = params.location;
    if (params.recurrenceRule !== undefined) schedule.recurrenceRule = params.recurrenceRule;
    if (params.priority !== undefined) schedule.priority = params.priority;
    if (params.color !== undefined) schedule.color = params.color;
    if (params.timezone !== undefined) schedule.timezone = params.timezone;
    if (params.reminders !== undefined) schedule.reminders = params.reminders;
    if (params.tags !== undefined) schedule.tags = params.tags;

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
    await this.scheduleRepository.delete(uuid);
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
    const schedules = await this.scheduleRepository.findByDateRange(accountUuid, startTime, endTime);
    return schedules.map(s => s.toClientDTO());
  }
}

