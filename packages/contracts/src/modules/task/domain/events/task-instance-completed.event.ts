export interface TaskInstanceCompletedEvent {
  eventType: 'task.instance.completed';
  payload: {
    taskInstanceId: string;
    taskTemplateId: string;
    title: string;
    completedAt: number;
    identityId: string;
    goalBinding?: {
      goalId: string;
      keyResultId: string;
      incrementValue: number;
    };
  };
}
