/**
 * Get Task Template Service
 *
 * 鑾峰彇浠诲姟妯℃澘璇︽儏
 */

import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import type { GetTaskTemplateRes } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Get Task Template Service
 */
export class GetTaskTemplate {
  constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  async execute(id: string, includeChildren = false): Promise<Result<GetTaskTemplateRes>> {
    const template = includeChildren
      ? await this.templateRepository.findByIdWithChildren(id)
      : await this.templateRepository.findById(id);

    return ok(template ? template.toClientDTO(includeChildren) : null);
  }
}

