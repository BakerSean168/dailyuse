import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ScheduleTaskClientDTO, UpdateTaskMetadataRequest } from '@dailyuse/contracts/schedule';
import type { IScheduleTaskRepository } from '../../../domain-server';

/**
 * Update Schedule Task Metadata Use Case
 * 更新调度任务元数据用例
 */
export class UpdateScheduleTaskMetadataUseCase {
  constructor(private readonly scheduleTaskRepository: IScheduleTaskRepository) {}

  async execute(
    id: string,
    metadata: UpdateTaskMetadataRequest,
  ): Promise<Result<ScheduleTaskClientDTO>> {
    const task = await this.scheduleTaskRepository.findById(id);
    if (!task) {
      return error('NOT_FOUND', `Schedule task ${id} not found`);
    }

    task.updateMetadata(metadata);
    await this.scheduleTaskRepository.save(task);

    return ok(task.toClientDTO());
  }
}
