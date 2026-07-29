/**
 * Goal progress percentage helpers.
 * Residual 1083 keep-boundary: local clampPercentage is fixed 0–100 domain with
 * non-finite → 0. Intentionally not shell clamp(value, min, max) geometry sole
 * (variable range + max < min fail-safe).
 */
import type { GoalClientDTO, KeyResultClientDTO, KeyResultProgress } from '@memoflow/contracts/goal';

// Residual 1083 keep-boundary: fixed 0–100 percentage clamp (no geometry dual).
function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function getKeyResultProgressPercentage(progress: KeyResultProgress | null | undefined): number {
  if (!progress) return 0;
  const initialValue = progress.initialValue ?? 0;
  const currentValue = progress.currentValue ?? 0;
  const targetValue = progress.targetValue ?? 0;

  if (targetValue === initialValue) {
    return currentValue >= targetValue ? 100 : 0;
  }

  return clampPercentage(
    Math.round(((currentValue - initialValue) / (targetValue - initialValue)) * 100),
  );
}

export function isKeyResultCompleted(progress: KeyResultProgress | null | undefined): boolean {
  return getKeyResultProgressPercentage(progress) >= 100;
}

export function getGoalOverallProgress(goal: GoalClientDTO | null | undefined): number {
  if (!goal) return 0;
  if (typeof goal.overallProgress === 'number') {
    return clampPercentage(Math.round(goal.overallProgress));
  }

  const keyResults = goal.keyResults ?? [];
  if (keyResults.length === 0) return 0;

  const totalWeight = keyResults.reduce((sum, keyResult) => sum + (keyResult.weight ?? 1), 0);
  if (totalWeight <= 0) {
    const average =
      keyResults.reduce((sum, keyResult) => sum + getKeyResultProgressPercentage(keyResult.progress), 0) /
      keyResults.length;
    return clampPercentage(Math.round(average));
  }

  const weighted =
    keyResults.reduce(
      (sum, keyResult) =>
        sum + getKeyResultProgressPercentage(keyResult.progress) * (keyResult.weight ?? 1),
      0,
    ) / totalWeight;

  return clampPercentage(Math.round(weighted));
}

export function getCompletedKeyResultCount(goal: GoalClientDTO | null | undefined): number {
  if (!goal) return 0;
  if (typeof goal.completedKeyResults === 'number') return goal.completedKeyResults;
  return (goal.keyResults ?? []).filter((keyResult: KeyResultClientDTO) =>
    isKeyResultCompleted(keyResult.progress),
  ).length;
}
