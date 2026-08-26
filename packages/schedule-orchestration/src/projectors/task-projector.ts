import type { SchedulingPort } from '@memoflow/contracts/schedule';
import type { TaskScheduleProjectionSource } from '@memoflow/task/schedule-projection';

export interface TaskProjector {
  upsertTemplate(templateId: string, identityId: string): Promise<void>;
  deleteTemplate(templateId: string, identityId: string): Promise<void>;
}

export interface CreateTaskProjectorDeps {
  readonly source: TaskScheduleProjectionSource;
  readonly schedulingPort: SchedulingPort;
}

/** Task-owned desired scheduling set -> neutral SchedulingPort. */
export function createTaskProjector(deps: CreateTaskProjectorDeps): TaskProjector {
  return {
    async upsertTemplate(templateId, identityId) {
      const plan = await deps.source.buildTemplatePlan(templateId, identityId);
      await deps.schedulingPort.reconcile(plan.owner, plan.desired);
    },

    async deleteTemplate(templateId, identityId) {
      await deps.schedulingPort.removeOwner(deps.source.buildTemplateOwner(templateId, identityId));
    },
  };
}
