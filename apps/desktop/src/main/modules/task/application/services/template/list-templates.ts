/**
 * List Task Templates Use Case
 */

import { ListTaskTemplates } from '@dailyuse/task/application-server';
import type { TaskTemplateClientDTO, QueryTaskTemplatesRequest } from '@dailyuse/contracts/task';

export async function listTemplatesUseCase(
  params: QueryTaskTemplatesRequest
): Promise<{ templates: TaskTemplateClientDTO[]; total: number }> {
  const result = await ListTaskTemplates.getInstance().execute(params);
  return {
    templates: result.templates as TaskTemplateClientDTO[],
    total: result.total,
  };
}
