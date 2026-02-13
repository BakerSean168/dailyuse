/**
 * Activate Task Template Service
 *
 * 婵€娲讳换鍔℃ā锟?
 * 涓氬姟閫昏緫锟?
 * 1. 淇敼妯℃澘鐘舵€佷负 ACTIVE
 * 2. 绔嬪嵆鐢熸垚瀹炰緥
 * 3. 鍙戝竷鎭㈠浜嬩欢锛岃Е鍙戞彁閱掕皟搴︽仮锟?
 */

import type { ITaskTemplateRepository } from '../../domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '../../domain-server/repositories/ITaskInstanceRepository';
import { TaskInstanceGenerationService } from '../../domain-server/services/TaskInstanceGenerationService';
import type { TaskTemplateClientDTO, TaskTemplateResponse } from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

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

  async execute(uuid: string): Promise<Result<{ template: TaskTemplateClientDTO; instancesGenerated: number }>> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      return error('NOT_FOUND', `TaskTemplate ${uuid} not found`);
    }

    // 1. 婵€娲绘ā鏉跨姸锟?
    template.activate();
    await this.templateRepository.save(template);

    // 2. 鐢熸垚瀹炰緥
    const instances = this.generationService.generateInstances(template);
    let instancesGenerated = 0;

    if (instances.length > 0) {
      await this.instanceRepository.saveMany(instances);
      await this.templateRepository.save(template);
      instancesGenerated = instances.length;
    }

    // 3. 鍙戝竷鎭㈠浜嬩欢
    try {
      await eventBus.publish({
        eventType: 'task.template.resumed',
        payload: {
          taskTemplateId: template.id,
          taskTemplateTitle: template.title,
          identityId: template.identityId,
          resumedAt: Date.now(),
          taskTemplateData: template.toServerDTO(),
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`锟?[ActivateTaskTemplate] 鍙戝竷鎭㈠浜嬩欢澶辫触:`, error);
    }

    return ok({
      template: template.toClientDTO(),
      instancesGenerated,
    });
  }
}

