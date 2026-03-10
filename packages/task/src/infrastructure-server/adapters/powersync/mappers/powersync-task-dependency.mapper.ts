import type { DependencyType, TaskDependencyServerDTO } from '@dailyuse/contracts/task';

export type PowerSyncTaskDependencyRow = {
  id: string;
  identity_id: string;
  predecessor_task_id: string;
  successor_task_id: string;
  dependency_type: string;
  lag_days: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export class PowerSyncTaskDependencyMapper {
  static toDTO(data: PowerSyncTaskDependencyRow): TaskDependencyServerDTO {
    return {
      id: data.id,
      identityId: data.identity_id,
      predecessorTaskId: data.predecessor_task_id,
      successorTaskId: data.successor_task_id,
      dependencyType: data.dependency_type as DependencyType,
      lagDays: data.lag_days ?? undefined,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    };
  }
}
