/**
 * Residual 1261: sole formatDateNotSet — epoch ms → toLocaleDateString, empty → English 'Not set'.
 * Dual-retired from AccountScreen + GoalDetailScreen (identical date-only empty label).
 * Soft residual 1261 / 1240:
 * - TaskDetailScreen: toLocaleString + 'Not set' (datetime presentation)
 * - GoalCompareScreen: toLocaleDateString + '-' (keep-boundary Residual 1240)
 * - Notification*: toLocaleString + 'Unknown'
 * Soft residual 1240: vue goal i18n notSet / schedule N/A / reminder date-fns remain separate.
 */
export function formatDateNotSet(timestamp: number | null): string {
  if (!timestamp) {
    return 'Not set';
  }

  return new Date(timestamp).toLocaleDateString();
}
