/**
 * IScheduleRepository
 * Interface for user-facing calendar schedule repository
 *
 * @module Schedule
 * @since Story 9.2 (EPIC-SCHEDULE-001)
 */

import type { Schedule } from '../aggregates/schedule';

export interface IScheduleRepository {
  /**
   * Persist a schedule aggregate
   */
  save(schedule: Schedule): Promise<void>;

  /**
   * Find a schedule by its UUID
   */
  findByUuid(uuid: string): Promise<Schedule | null>;

  /**
   * Find all schedules for an account
   */
  findByAccountUuid(accountUuid: string): Promise<Schedule[]>;

  /**
   * Delete schedule by UUID
   */
  deleteByUuid(uuid: string): Promise<void>;

  /**
   * Find schedules that overlap a given time range for an account.
   * @param accountUuid The account to query
   * @param startTime Start of the query range (timestamp ms)
   * @param endTime End of the query range (timestamp ms)
   * @param excludeUuid Optional schedule UUID to exclude (editing scenario)
   */
  findByTimeRange(
    accountUuid: string,
    startTime: number,
    endTime: number,
    excludeUuid?: string
  ): Promise<Schedule[]>;

  /**
   * Optional transaction wrapper for future use (Story 9.3)
   */
  withTransaction?<T>(fn: (repo: IScheduleRepository) => Promise<T>): Promise<T>;
}
