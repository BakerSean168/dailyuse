/**
 * List Task Templates By Priority
 *
 * 按优先级排序获取任务模板
 */

import type { ITaskTemplateRepository } from '@/domain-server/repositories/i-task-template-repository';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class ListTaskTemplatesByPriorityUseCase {
  constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  async execute(identityId: string, limit?: number): Promise<Result<TaskTemplateClientDTO[]>> {
    const templates = await this.templateRepository.findSortedByPriority(identityId, limit);
    return ok(templates.map((t) => t.toClientDTO()));
  }
}
