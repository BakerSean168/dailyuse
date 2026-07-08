import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { QueryTaskTemplateGraphRes, QueryTaskTemplatesInternal } from '@dailyuse/contracts/task';
import type { ITaskDependencyRepository } from '../../../domain/repositories/i-task-dependency-repository';
import type { ListTaskTemplatesUseCase } from './list-task-templates.use-case';

/**
 * Returns the filtered template list together with the dependency edges between
 * those templates so clients can render a graph in one request.
 */
export class GetTaskTemplateGraphUseCase {
  constructor(
    private readonly listTaskTemplates: ListTaskTemplatesUseCase,
    private readonly dependencyRepository: ITaskDependencyRepository,
  ) {}

  async execute(request: QueryTaskTemplatesInternal): Promise<Result<QueryTaskTemplateGraphRes>> {
    const templateResult = await this.listTaskTemplates.execute(request);

    if (!templateResult.ok) {
      return templateResult as Result<QueryTaskTemplateGraphRes>;
    }

    const templateIds = new Set(templateResult.data.templates.map((template) => template.id));
    const allDependencies = await this.dependencyRepository.findAllByIdentityId(request.identityId);
    const dependencies = allDependencies
      .filter(
        (dependency) =>
          templateIds.has(dependency.predecessorTaskId) && templateIds.has(dependency.successorTaskId),
      )
      .map((dependency) => ({
        id: dependency.id,
        predecessorTaskId: dependency.predecessorTaskId,
        successorTaskId: dependency.successorTaskId,
        dependencyType: dependency.dependencyType,
        lagDays: dependency.lagDays,
        createdAt: dependency.createdAt,
        updatedAt: dependency.updatedAt,
      }));

    return ok({
      templates: templateResult.data.templates,
      dependencies,
      total: templateResult.data.total,
    });
  }
}
