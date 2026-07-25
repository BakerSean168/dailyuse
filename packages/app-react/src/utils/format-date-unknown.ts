/**
 * Residual 1264: sole formatDateUnknown — epoch ms → toLocaleString, empty → English 'Unknown'.
 * Dual-retired from NotificationDetailScreen + NotificationCard (identical datetime empty label).
 * Soft residual 1264 / 1261 / 1240:
 * - formatDateNotSet dual-retired sole remains separate (date-only + 'Not set')
 * - TaskDetailScreen: toLocaleString + 'Not set'
 * - GoalCompareScreen: toLocaleDateString + '-' (keep-boundary Residual 1240)
 * - GoalReview*: non-null timestamp formatters without empty label
 */
export function formatDateUnknown(value: number | null | undefined): string {
  if (!value) {
    return 'Unknown';
  }

  return new Date(value).toLocaleString();
}
