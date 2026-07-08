/**
 * List Schedule Tasks By Status Use Case
 * 按状态列出调度任务用例
 *
 * 【应用服务职责】
 * - 查询任务列表
 * - DTO 转换
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { IScheduleTaskRepository } from '../../../domain';
import type { ScheduleTaskClientDTO, ScheduleTaskStatus } from '@dailyuse/contracts/schedule';

/**
 * List Schedule Tasks By Status Use Case
 *
 * 【执行流程】
 * 1. 查询指定状态的所有任务
 * 2. 转换为 Client DTO 列表
 */
export class ListScheduleTasksByStatusUseCase {
  constructor(
    private readonly scheduleTaskRepository: IScheduleTaskRepository,
  ) {}

  async execute(status: ScheduleTaskStatus): Promise<Result<ScheduleTaskClientDTO[]>> {
    // 1. 查询指定状态的所有任务
    const tasks = await this.scheduleTaskRepository.findByStatus(status);

    // 2. 转换为 Client DTO 列表
    return ok(tasks.map((t) => t.toClientDTO()));
  }
}
