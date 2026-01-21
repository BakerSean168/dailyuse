/**
 * Get Task Template Service
 *
 * 获取任务模板详情
 */

import type { ITaskTemplateRepository } from '@dailyuse/domain-server/task';
import type { TaskTemplateClientDTO, TaskTemplateResponse } from '@dailyuse/contracts/task';

/**
 * Get Task Template Service
 */
export class GetTaskTemplate {
  constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  async execute(uuid: string, includeChildren = false): Promise<TaskTemplateResponse> {
    const template = includeChildren
      ? await this.templateRepository.findByUuidWithChildren(uuid)
      : await this.templateRepository.findByUuid(uuid);

    return {
      template: template ? template.toClientDTO(includeChildren) : (null as unknown as TaskTemplateClientDTO),
    };
  }
}

