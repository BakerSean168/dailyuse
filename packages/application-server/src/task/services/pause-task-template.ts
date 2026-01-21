/**
 * Pause Task Template Service
 *
 * 暂停任务模板
 * 业务逻辑�?
 * 1. 修改模板状态为 PAUSED
 * 2. 停止生成新的任务实例
 * 3. 处理已存在的未完成实例（标记�?SKIPPED�?
 * 4. 发布暂停事件，触发提醒调度暂�?
 */

import type {
  ITaskTemplateRepository,
  ITaskInstanceRepository,
} from '@dailyuse/domain-server/task';
import type { TaskTemplateClientDTO, TaskTemplateResponse } from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';

/**
 * Pause Task Template Service
 */
export class PauseTaskTemplate {
  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {}

  async execute(uuid: string, reason?: string): Promise<{ template: TaskTemplateClientDTO; instancesSkipped: number }> {
    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`TaskTemplate ${uuid} not found`);
    }

    // 1. 暂停模板状�?
    template.pause();
    await this.templateRepository.save(template);

    // 2. 处理未完成的任务实例
    const instancesSkipped = await this.handleInstancesOnPause(uuid);

    // 3. 发布暂停事件
    try {
      await eventBus.publish({
        eventType: 'task.template.paused',
        payload: {
          taskTemplateUuid: template.uuid,
          accountUuid: template.accountUuid,
          pausedAt: Date.now(),
          reason: reason || '用户手动暂停',
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`�?[PauseTaskTemplate] 发布暂停事件失败:`, error);
    }

    return {
      template: template.toClientDTO(),
      instancesSkipped,
    };
  }

  /**
   * 处理暂停时的任务实例
   */
  private async handleInstancesOnPause(templateUuid: string): Promise<number> {
    try {
      const instances = await this.instanceRepository.findByTemplate(templateUuid);
      const pendingInstances = instances.filter(
        (inst) => inst.status === 'PENDING' || inst.status === 'IN_PROGRESS',
      );

      if (pendingInstances.length === 0) {
        return 0;
      }

      for (const instance of pendingInstances) {
        instance.skip('模板已暂�?);
        await this.instanceRepository.save(instance);
      }

      return pendingInstances.length;
    } catch (error) {
      console.error(`�?[PauseTaskTemplate] 处理实例失败:`, error);
      return 0;
    }
  }
}

