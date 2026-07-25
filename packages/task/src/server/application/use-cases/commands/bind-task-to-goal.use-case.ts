/**
 * Bind Task To Goal
 *
 * 将任务模板绑定至目标
 */

import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { TaskTemplateClientDTO, BindToGoalReq } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class BindTaskToGoalUseCase {
  constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  async execute(
    templateId: string,
    identityId: string,
    request: BindToGoalReq,
  ): Promise<Result<TaskTemplateClientDTO>> {
    const template = await this.templateRepository.findByIdForIdentity(identityId, templateId);
    if (!template) {
      return error('NOT_FOUND', `TaskTemplate ${templateId} not found`);
    }

    template.bindToGoal(request.goalId, request.keyResultId, request.goalRecordValue);
    await this.templateRepository.save(template);

    return ok(template.toClientDTO());
  }
}
