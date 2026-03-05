/**
 * Generate Task Instances
 *
 * 为指定模板生成任务实例
 */

import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import { TaskInstanceGenerationService } from '@/domain-server/services/TaskInstanceGenerationService';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class GenerateTaskInstances {
  private readonly generationService: TaskInstanceGenerationService;

  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {
    this.generationService = new TaskInstanceGenerationService();
  }

  async execute(
    templateId: string,
    request: { fromDate: number; toDate: number },
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      return error('NOT_FOUND', `TaskTemplate ${templateId} not found`);
    }

    const instances = this.generationService.generateInstances(template, {
      forceGenerate: true,
      targetDate: request.toDate,
    });

    if (instances.length > 0) {
      await this.instanceRepository.saveMany(instances);
      await this.templateRepository.save(template);
    }

    return ok(instances.map((i) => i.toClientDTO()));
  }
}
