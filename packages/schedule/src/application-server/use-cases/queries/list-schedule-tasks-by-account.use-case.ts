/**
 * List Schedule Tasks By Account Use Case
 * 按账户列出调度任务用例
 * 
 * 【应用服务职责】
 * - 查询任务列表
 * - DTO 转换
 */

import type { IScheduleTaskRepository } from '../../../domain-server';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';

/**
 * List Schedule Tasks By Account Use Case
 * 
 * 【执行流程】
 * 1. 查询指定账户的所有任务
 * 2. 转换为 Client DTO 列表
 */
export class ListScheduleTasksByAccountUseCase {
  constructor(
    private readonly scheduleTaskRepository: IScheduleTaskRepository,
  ) {}

  async execute(identityId: string): Promise<ScheduleTaskClientDTO[]> {
    // 1. 查询指定账户的所有任务
    const tasks = await this.scheduleTaskRepository.findByIdentityId(identityId);

    // 2. 转换为 Client DTO 列表
    return tasks.map((t: any) => t.toClientDTO());
  }
}
