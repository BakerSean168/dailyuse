/**
 * Update Schedule Task Use Case
 * 更新调度任务用例
 *
 * 【应用服务职责】
 * - 查询现有任务
 * - 调用聚合根的业务方法更新状态
 * - 持久化更新
 * - DTO 转换
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IScheduleTaskRepository } from '../../../domain-server';
import type {
  ScheduleTaskClientDTO,
  ScheduleConfigServerDTO,
  RetryPolicyServerDTO,
} from '@dailyuse/contracts/schedule';

/**
 * 更新调度任务的请求参数
 */
export interface UpdateScheduleTaskReq {
  id: string;
  scheduleConfig?: ScheduleConfigServerDTO;
  retryPolicy?: RetryPolicyServerDTO;
  enabled?: boolean;
  description?: string;
  handlerPayload?: any;
}

/**
 * Update Schedule Task Use Case
 *
 * 【执行流程】
 * 1. 查询现有任务
 * 2. 调用聚合根方法更新字段
 * 3. 持久化更新
 * 4. 返回更新后的 DTO
 */
export class UpdateScheduleTaskUseCase {
  constructor(
    private readonly scheduleTaskRepository: IScheduleTaskRepository,
  ) {}

  async execute(req: UpdateScheduleTaskReq): Promise<Result<ScheduleTaskClientDTO>> {
    // 1. 查询现有任务
    const task = await this.scheduleTaskRepository.findById(req.id);
    if (!task) {
      return error('NOT_FOUND', `Schedule task ${req.id} not found`);
    }

    // 2. 调用聚合根方法更新字段
    if (req.description !== undefined) {
      task.updateMetadata({ description: req.description });
    }
    if (req.enabled !== undefined) {
      if (req.enabled) {
        task.enable();
      } else {
        task.disable();
      }
    }
    if (req.scheduleConfig !== undefined) {
      task.updateSchedule(req.scheduleConfig);
    }
    if (req.retryPolicy !== undefined) {
      task.updateRetryPolicy(req.retryPolicy);
    }
    if (req.handlerPayload !== undefined) {
      task.updatePayload(req.handlerPayload);
    }

    // 3. 持久化更新
    await this.scheduleTaskRepository.save(task);

    // 4. 返回更新后的 DTO
    return ok(task.toClientDTO());
  }
}
