import type { IElectronDatabase } from '@memoflow/contracts/electron';
import {
  GoalTaskBindingQueryInputSchema,
  type GoalDependencyReadPort,
  type GoalTaskBindingQueryInput,
} from '@memoflow/contracts/reliable-messaging';

export class PowerSyncTaskBindingReadPort implements GoalDependencyReadPort {
  constructor(private readonly db: IElectronDatabase) {}

  async checkActiveTaskBindings(input: GoalTaskBindingQueryInput): Promise<{
    hasActiveBindings: boolean;
    activeCount: number;
  }> {
    const validated = GoalTaskBindingQueryInputSchema.parse(input);
    const rows = await this.db.getAll<{ count: number }>(
      'SELECT COUNT(*) as count FROM task_templates WHERE identity_id = ? AND goal_id = ? AND deleted_at IS NULL',
      [validated.identityId, validated.goalId],
    );
    const count = Number(rows[0]?.count ?? 0);
    return {
      hasActiveBindings: count > 0,
      activeCount: count,
    };
  }
}
