import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';
import type { IdentityId, TaskTemplateId, GoalId } from '../../../../primitives';

export interface TaskCreatedEvent {
  identityId: IdentityId;
  task: TaskTemplateServerDTO;
  templateId: TaskTemplateId;
  goalId: GoalId | null;
}
