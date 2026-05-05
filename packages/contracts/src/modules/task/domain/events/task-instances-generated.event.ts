import type { IdentityId, TaskTemplateId } from '../../../../primitives';

export interface TaskInstancesGeneratedEvent {
  identityId: IdentityId;
  templateId: TaskTemplateId;
  templateTitle: string;
  instanceCount: number;
  strategy: 'full' | 'summary';
}
