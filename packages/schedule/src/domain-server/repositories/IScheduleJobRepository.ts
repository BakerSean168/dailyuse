/**
 * IScheduleJobRepository
 * Interface for schedule job (cross-module triggers) repository
 *
 * @module Schedule
 */

import type { ScheduleJobServerDTO } from '@dailyuse/contracts/schedule';

export interface IScheduleJobRepository {
  /**
   * Persist a schedule job
   */
  save(job: ScheduleJobServerDTO): Promise<void>;

  /**
   * Find a schedule job by its UUID
   */
  findByUuid(uuid: string): Promise<ScheduleJobServerDTO | null>;

  /**
   * Find all schedule jobs for an account
   */
  findByAccountUuid(accountUuid: string): Promise<ScheduleJobServerDTO[]>;

  /**
   * Find schedule jobs by source module and source entity
   */
  findBySource(sourceModule: string, sourceId: string): Promise<ScheduleJobServerDTO[]>;

  /**
   * Find jobs due to run before a given time
   */
  findDueJobs(beforeTime: Date): Promise<ScheduleJobServerDTO[]>;

  /**
   * Delete schedule job by UUID
   */
  delete(uuid: string): Promise<void>;

  /**
   * Delete all schedule jobs for a source entity
   */
  deleteBySource(sourceModule: string, sourceId: string): Promise<void>;
}
