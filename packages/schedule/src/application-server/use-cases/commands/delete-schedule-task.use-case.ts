/**
 * Delete Schedule Task Use Case
 * 删除调度任务用例
 * 
 * 【应用服务职责】
 * - 查询任务是否存在
 * - 执行删除操作
 * - 事务协调
 */

import type { IScheduleTaskRepository } from '../../../domain-server';
import { eventBus } from '@dailyuse/utils';

/**
 * Delete Schedule Task Use Case
 * 
 * 【执行流程】
 * 1. 验证任务存在
 * 2. 执行删除
 */
export class DeleteScheduleTaskUseCase {
  constructor(
    private readonly scheduleTaskRepository: IScheduleTaskRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // 1. 验证任务存在
    const task = await this.scheduleTaskRepository.findById(id);
    if (!task) {
      throw new Error(`Schedule task ${id} not found`);
    }

    // 2. 执行删除（硬删除或软删除取决于业务需求）
    await this.scheduleTaskRepository.deleteById(id);
    (eventBus as any).send('schedule:task:deleted', { taskId: id });
  }
}
