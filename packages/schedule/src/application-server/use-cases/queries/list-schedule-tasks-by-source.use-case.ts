/**
 * List Schedule Tasks By Source Use Case
 * 按源实体列出调度任务用例
 * 
 * 【应用服务职责】
 * - 查询任务列表
 * - DTO 转换
 */

import type { IScheduleTaskRepository } from '../../../domain-server';
import type { ScheduleTaskClientDTO, SourceModule } from '@dailyuse/contracts/schedule';

/**
 * List Schedule Tasks By Source Use Case
 * 
 * 【执行流程】
 * 1. 查询指定源模块和源实体的所有任务
 * 2. 转换为 Client DTO 列表
 */
export class ListScheduleTasksBySourceUseCase {
  constructor(
    private readonly scheduleTaskRepository: IScheduleTaskRepository,
  ) {}

  async execute(sourceModule: SourceModule, sourceId: string): Promise<ScheduleTaskClientDTO[]> {
    // 1. 查询指定源的所有任务
    const tasks = await this.scheduleTaskRepository.findBySourceEntity(sourceModule, sourceId);

    // 2. 转换为 Client DTO 列表
    return tasks.map((t: any) => t.toClientDTO());
  }
}
