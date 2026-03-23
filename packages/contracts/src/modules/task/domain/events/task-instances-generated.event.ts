export interface TaskInstancesGeneratedEvent {
  identityId: string;
  templateId: string;
  templateTitle: string;
  instanceCount: number;
  strategy: 'full' | 'summary';
}
