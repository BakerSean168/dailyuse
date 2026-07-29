/**
 * List Task Templates By Priority
 *
 * 按优先级排序获取任务模板
 */

import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { TaskTemplateClientDTO } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';

export class ListTaskTemplatesByPriorityUseCase {
  constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  async execute(identityId: string, limit?: number): Promise<Result<TaskTemplateClientDTO[]>> {
    const templates = await this.templateRepository.findSortedByPriority(identityId, limit);
    return ok(templates.map((t) => t.toClientDTO()));
  }
}
