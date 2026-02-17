import type { IScheduleRepository } from '../../domain-server/repositories/IScheduleRepository';
import { CalendarEntry } from '../../domain-server/aggregates/calendar-entry';
import type { CalendarEntryClientDTO } from '@dailyuse/contracts/schedule';
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
    identityId: string;
    title: string;
    startTime: number;
    endTime: number;
    description?: string;
    location?: string;
    priority?: number;
    attendees?: string[];
  }): Promise<CalendarEntryClientDTO> {
    const schedule = CalendarEntry.create({
      identityId: params.identityId,
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
    id: string,
    params: {
      title?: string;
      startTime?: number;
      endTime?: number;
      description?: string;
      location?: string;
      priority?: number;
      attendees?: string[];
    }
  ): Promise<CalendarEntryClientDTO> {
    const schedule = await this.scheduleRepository.findById(id);
    if (!schedule) {
      throw new Error(`Schedule event ${id} not found`);
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
  async deleteSchedule(id: string): Promise<void> {
    const schedule = await this.scheduleRepository.findById(id);
    if (!schedule) {
      throw new Error(`Schedule event ${id} not found`);
    }
    await this.scheduleRepository.deleteById(id);
  }

  /**
   * Get Schedule Event
   */
  async getSchedule(id: string): Promise<CalendarEntryClientDTO | null> {
    const schedule = await this.scheduleRepository.findById(id);
    return schedule ? schedule.toClientDTO() : null;
  }

  /**
   * Get Schedules by Date Range
   */
  async getSchedulesByRange(
    identityId: string,
    startTime: number,
    endTime: number
  ): Promise<CalendarEntryClientDTO[]> {
    const schedules = await this.scheduleRepository.findByTimeRange(identityId, startTime, endTime);
    return schedules.map((s: any) => s.toClientDTO());
  }
}

