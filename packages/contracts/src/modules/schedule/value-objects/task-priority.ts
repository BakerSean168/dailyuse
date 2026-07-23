/**
 * 任务优先级
 */
export const TaskPriority = {
  Low: 'Low', // 低优先级
  Normal: 'Normal', // 普通优先级（默认）
  High: 'High', // 高优先级
  Urgent: 'Urgent', // 紧急优先级
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

/**
 * Residual 1168: sole importance → TaskPriority mapper for schedule projections.
 * Goal + Task schedule-projection-source dual mapPriority bodies retired onto this helper.
 * Soft residual 1168: buildTaskName / trigger math stay domain-specific (no force-merge).
 */
export function mapImportanceToTaskPriority(
  importance: string,
): TaskPriority {
  if (importance === 'Vital') {
    return TaskPriority.Urgent;
  }
  if (importance === 'Important') {
    return TaskPriority.High;
  }
  return TaskPriority.Normal;
}

