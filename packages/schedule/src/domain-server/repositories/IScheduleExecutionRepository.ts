import type { ScheduleExecution } from '../entities/schedule-execution';

/**
 * IScheduleExecutionRepository - Repository Interface
 * ScheduleExecution 仓储接口
 */
export interface IScheduleExecutionRepository {
  /**
   * 保存 ScheduleExecution 实体
   */
  save(execution: ScheduleExecution): Promise<void>;

  /**
   * 根据 UUID 查找 ScheduleExecution
   */
  findByUuid(uuid: string): Promise<ScheduleExecution | null>;

  /**
   * 根据 Task UUID 查找所有执行记录
   */
  findByTaskUuid(taskUuid: string): Promise<ScheduleExecution[]>;
}
