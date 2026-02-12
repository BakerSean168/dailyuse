/**
 * Get Task Template Service
 *
 * 获取任务模板详情
 */

import type { ITaskTemplateRepository } from '@/domain-server';
import type { TaskTemplateClientDTO, TaskTemplateResponse } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Get Task Template Service
 */
export class GetTaskTemplate {
  constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  async execute(uuid: string, includeChildren = false): Promise<Result<TaskTemplateResponse>> {
    const template = includeChildren
      ? await this.templateRepository.findByUuidWithChildren(uuid)
      : await this.templateRepository.findByUuid(uuid);

    return ok({
      template: template ? template.toClientDTO(includeChildren) : (null as unknown as TaskTemplateClientDTO),
    });
  }
}

