import type { ScheduleExecution } from '../entities/schedule-execution';

/**
 * IScheduleExecutionRepository - Repository Interface
 * ScheduleExecution 浠撳偍鎺ュ彛
 */
export interface IScheduleExecutionRepository {
  /**
   * 淇濆瓨 ScheduleExecution 瀹炰綋
   */
  save(execution: ScheduleExecution): Promise<void>;

  /**
   * 鏍规嵁 UUID 鏌ユ壘 ScheduleExecution
   */
  findById(id: string): Promise<ScheduleExecution | null>;

  /**
   * 鏍规嵁 Task UUID 鏌ユ壘鎵€鏈夋墽琛岃褰?
   */
  findByTaskId(taskId: string): Promise<ScheduleExecution[]>;
}
