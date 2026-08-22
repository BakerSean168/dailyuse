import type { TaskPlanMutationPort } from '@memoflow/ai';
import type { IdentityId } from '@memoflow/contracts/primitives';
import { ok } from '@memoflow/contracts/result';
import type { TaskApplicationPort } from '@memoflow/task';

/** Desktop-host binding for the Mastra `task.create` Workflow. */
export class DesktopTaskPlanMutationAdapter implements TaskPlanMutationPort {
  constructor(private readonly task: TaskApplicationPort) {}

  async createTaskTemplate(
    request: Parameters<TaskPlanMutationPort['createTaskTemplate']>[0],
    context: Parameters<TaskPlanMutationPort['createTaskTemplate']>[1],
  ) {
    const result = await this.task.createTaskTemplate({
      ...request,
      identityId: context.identityId as IdentityId,
    });
    if (!result.ok) return result;
    return ok({ taskId: String(result.data.template.id) });
  }
}
