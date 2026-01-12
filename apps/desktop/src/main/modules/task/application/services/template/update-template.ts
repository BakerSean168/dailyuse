/**
 * Update Task Template Use Case
 */

import { TaskContainer } from '@dailyuse/infrastructure-server';
import type { TaskTemplateClientDTO, CreateTaskTemplateRequest } from '@dailyuse/contracts/task';

export async function updateTemplateUseCase(
  uuid: string,
  updates: Partial<CreateTaskTemplateRequest>
): Promise<TaskTemplateClientDTO> {
  const container = TaskContainer.getInstance();
  const repo = container.getTemplateRepository();
  const template = await repo.findByUuid(uuid);
  if (!template) {
    throw new Error(`Task template not found: ${uuid}`);
  }

  // Update properties using domain methods
  if (updates.title) template.updateTitle(updates.title);
  if (updates.description !== undefined) template.updateDescription(updates.description ?? '');
  if (updates.importance) template.updatePriority(updates.importance, template.urgency);
  if (updates.urgency) template.updatePriority(template.importance, updates.urgency);
  if (updates.tags) template.updateTags(updates.tags);

  await repo.save(template);
  return template.toClientDTO();
}
