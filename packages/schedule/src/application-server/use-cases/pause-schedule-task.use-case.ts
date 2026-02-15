/**
 * Pause Schedule Task Use Case
 * 暂停调度任务用例
 * 
 * 【应用服务职责】
 * - 查询任务
 * - 调用聚合根的暂停方法
 * - 持久化状态变更
 */

import type { IScheduleTaskRepository } from '../../domain-server/repositories/IScheduleTaskRepository';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';

/**
 * Pause Schedule Task Use Case
 * 
 * 【执行流程】
 * 1. 查询任务
 * 2. 调用聚合根的 disable 方法
 * 3. 持久化
 * 4. 返回 DTO
 */
export class PauseScheduleTaskUseCase {
  constructor(
    private readonly scheduleTaskRepository: IScheduleTaskRepository,
  ) {}

  async execute(uuid: string): Promise<ScheduleTaskClientDTO> {
    // 1. 查询任务
    const task = await this.scheduleTaskRepository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Schedule task ${uuid} not found`);
    }

    // 2. 调用聚合根的 disable 方法（业务逻辑在聚合根内）
    task.disable();

    // 3. 持久化
    await this.scheduleTaskRepository.save(task);

    // 4. 返回 DTO
    return task.toClientDTO();
  }
}
