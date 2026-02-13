/**
 * Get Task Template Service
 *
 * 鑾峰彇浠诲姟妯℃澘璇︽儏
 */

import type { ITaskTemplateRepository } from '../../domain-server/repositories/ITaskTemplateRepository';
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
      ? await this.templateRepository.findByIdWithChildren(uuid)
      : await this.templateRepository.findById(uuid);

    return ok({
      template: template ? template.toClientDTO(includeChildren) : (null as unknown as TaskTemplateClientDTO),
    });
  }
}

