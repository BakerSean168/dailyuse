/**
 * Activate Task Template Service
 *
 * 激活任务模�?
 * 业务逻辑�?
 * 1. 修改模板状态为 ACTIVE
 * 2. 立即生成实例
 * 3. 发布恢复事件，触发提醒调度恢�?
 */

import type {
  ITaskTemplateRepository,
  ITaskInstanceRepository,
} from '@/domain-server';
import { TaskInstanceGenerationService } from '@/domain-server';
import type { TaskTemplateClientDTO, TaskTemplateResponse } from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';

/**
 * Activate Task Template Service
 */
export class ActivateTaskTemplate {
  private readonly generationService: TaskInstanceGenerationService;

  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {
    this.generationService = new TaskInstanceGenerationService();
  }

  async execute(uuid: string): Promise<{ template: TaskTemplateClientDTO; instancesGenerated: number }> {
    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`TaskTemplate ${uuid} not found`);
    }

    // 1. 激活模板状�?
    template.activate();
    await this.templateRepository.save(template);

    // 2. 生成实例
    const instances = this.generationService.generateInstances(template);
    let instancesGenerated = 0;

    if (instances.length > 0) {
      await this.instanceRepository.saveMany(instances);
      await this.templateRepository.save(template);
      instancesGenerated = instances.length;
    }

    // 3. 发布恢复事件
    try {
      await eventBus.publish({
        eventType: 'task.template.resumed',
        payload: {
          taskTemplateUuid: template.uuid,
          taskTemplateTitle: template.title,
          accountUuid: template.accountUuid,
          resumedAt: Date.now(),
          taskTemplateData: template.toServerDTO(),
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`�?[ActivateTaskTemplate] 发布恢复事件失败:`, error);
    }

    return {
      template: template.toClientDTO(),
      instancesGenerated,
    };
  }
}

