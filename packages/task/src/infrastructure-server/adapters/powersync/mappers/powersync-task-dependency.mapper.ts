import type { DependencyType, TaskDependencyServerDTO } from '@dailyuse/contracts/task';
import type { TaskDependencyId, IdentityId, TaskTemplateId } from '@dailyuse/contracts/primitives';

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
      id: data.id as TaskDependencyId,
      identityId: data.identity_id as IdentityId,
      predecessorTaskId: data.predecessor_task_id as TaskTemplateId,
      successorTaskId: data.successor_task_id as TaskTemplateId,
      dependencyType: data.dependency_type as DependencyType,
      lagDays: data.lag_days ?? undefined,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    };
  }
}
