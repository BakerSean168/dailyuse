export const TASK_GOAL_BINDING_CONSTRAINT = 'task_templates_goal_binding_complete';

export interface TaskGoalBindingSchemaQueryClient {
  query(sql: string): Promise<{
    rows: Array<Record<string, unknown>>;
    rowCount: number | null;
  }>;
}

export interface TaskGoalBindingConstraintReport {
  tablePresent: boolean;
  constraintCreated: boolean;
}

/** Installs the invariant that a Task goal binding is either absent or complete. */
export async function ensureTaskGoalBindingConstraint(
  client: TaskGoalBindingSchemaQueryClient,
): Promise<TaskGoalBindingConstraintReport> {
  const tableResult = await client.query(`SELECT to_regclass('public.task_templates') AS regclass`);
  if (!tableResult.rows[0]?.regclass) {
    return { tablePresent: false, constraintCreated: false };
  }

  const constraintResult = await client.query(`
    SELECT 1
    FROM pg_constraint
    WHERE conname = '${TASK_GOAL_BINDING_CONSTRAINT}'
      AND conrelid = 'public.task_templates'::regclass
  `);
  if (constraintResult.rows.length > 0) {
    return { tablePresent: true, constraintCreated: false };
  }

  await client.query(`
    ALTER TABLE task_templates
    ADD CONSTRAINT "${TASK_GOAL_BINDING_CONSTRAINT}"
    CHECK (
      (
        goal_id IS NULL AND key_result_id IS NULL AND
        goal_record_value IS NULL AND goal_progress_trigger IS NULL
      ) OR (
        goal_id IS NOT NULL AND key_result_id IS NOT NULL AND
        goal_record_value IS NOT NULL AND goal_record_value >= 0 AND
        goal_progress_trigger IS NOT NULL AND
        goal_progress_trigger IN ('PER_INSTANCE', 'ALL_INSTANCES_COMPLETED')
      )
    )
  `);

  return { tablePresent: true, constraintCreated: true };
}
