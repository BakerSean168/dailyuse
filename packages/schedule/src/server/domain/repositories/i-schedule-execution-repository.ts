import type { ScheduleExecution } from '../entities/schedule-execution';

/**
 * IScheduleExecutionRepository - Repository Interface
 */
export interface IScheduleExecutionRepository {
  /**
   * Save ScheduleExecution entity
   */
  save(execution: ScheduleExecution): Promise<void>;

  /**
   * Find by id (system/internal paths; authorization-sensitive loads use findByIdForIdentity)
   */
  findById(id: string): Promise<ScheduleExecution | null>;

  /**
   * Find by id scoped to identity
   */
  findByIdForIdentity(identityId: string, id: string): Promise<ScheduleExecution | null>;

  /**
   * Find all executions for a task scoped to identity
   */
  findByTaskId(identityId: string, taskId: string): Promise<ScheduleExecution[]>;
}
