/**
 * Unbind Task From Goal
 *
 * 解除任务模板与目标的绑定
 */

import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class UnbindTaskFromGoalUseCase {
  constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  async execute(templateId: string): Promise<Result<TaskTemplateClientDTO>> {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      return error('NOT_FOUND', `TaskTemplate ${templateId} not found`);
    }

    template.unlinkFromGoal();
    await this.templateRepository.save(template);

    return ok(template.toClientDTO());
  }
}
