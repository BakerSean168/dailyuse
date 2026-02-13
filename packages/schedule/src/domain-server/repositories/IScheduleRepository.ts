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
  findById(id: string): Promise<Schedule | null>;

  /**
   * Find all schedules for an account
   */
  findByIdentityId(identityId: string): Promise<Schedule[]>;

  /**
   * Delete schedule by UUID
   */
  deleteById(id: string): Promise<void>;

  /**
   * Find schedules that overlap a given time range for an account.
   * @param identityId The account to query
   * @param startTime Start of the query range (timestamp ms)
   * @param endTime End of the query range (timestamp ms)
   * @param excludeId Optional schedule UUID to exclude (editing scenario)
   */
  findByTimeRange(
    identityId: string,
    startTime: number,
    endTime: number,
    excludeId?: string
  ): Promise<Schedule[]>;

  /**
   * Optional transaction wrapper for future use (Story 9.3)
   */
  withTransaction?<T>(fn: (repo: IScheduleRepository) => Promise<T>): Promise<T>;
}
