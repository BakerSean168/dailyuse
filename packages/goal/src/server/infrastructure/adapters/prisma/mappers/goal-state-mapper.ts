/**
 * Goal State Mapper
 *
 * Converts raw persistence data → GoalState for domain reconstruction.
 * Shared by Prisma and PowerSync mappers.
 */

import type {
  ReviewType,
  KeyResultWeightSnapshotDTO,
  KeyResultCalculationMethod,
  GoalReminderConfigDTO,
  KeyResultSnapshotDTO,
} from '@memoflow/contracts/goal';
import { GoalStatus } from '@memoflow/contracts/goal';
import { IdentityId } from '@memoflow/domain-shared';
import { GoalId, GoalReviewId, KeyResultId } from '../../../../domain';
import {
  KeyResult,
  GoalReview,
  GoalReminderConfig,
  KeyResultWeightSnapshot,
} from '../../../../domain';
import type { GoalState } from '../../../../domain';

/**
 * Raw goal data from infrastructure mappers.
 * Fields are already parsed (not JSON strings) — the mapper provides
 * structured objects directly, eliminating JSON.stringify/parse round-trips.
 */
export interface RawGoalData {
  id: string;
  identityId: string;
  name: string;
  description: string | null;
  feasibilityAnalysis: string | null;
  motivation: string | null;
  status: string;
  startDate: number | null;
  dueDate: number | null;
  completedAt: number | null;
  archivedAt: number | null;
  sortOrder: number;
  reminderConfig: { enabled: boolean; triggers: unknown[] } | null;
  keyResults: RawKeyResultData[] | null;
  goalReviews: RawGoalReviewData[] | null;
  weightSnapshots: KeyResultWeightSnapshotDTO[] | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  version: number;
}

export interface RawKeyResultData {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  progress: {
    startingValue: number;
    progressBaselineValue: number | null;
    currentValue: number;
    targetValue: number;
    aggregationMethod: string;
    unit: string | null;
  };
  weight: number;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface RawGoalReviewData {
  id: string;
  goalId: string;
  type: string;
  title: string | null;
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  keyResultSnapshots: unknown[];
  reviewedAt: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Convert raw persistence data to GoalState for Goal.load()
 */
export function rawDataToGoalState(raw: RawGoalData): GoalState {
  const reminderConfig = raw.reminderConfig
    ? GoalReminderConfig.fromDTO(raw.reminderConfig as GoalReminderConfigDTO)
    : null;

  const keyResults = (raw.keyResults || []).map((kr) =>
    KeyResult.load({
      id: KeyResultId.of(kr.id),
      title: kr.title,
      description: kr.description ?? null,
      progress: {
        startingValue: kr.progress.startingValue ?? 0,
        progressBaselineValue: kr.progress.progressBaselineValue ?? null,
        currentValue: kr.progress.currentValue ?? 0,
        targetValue: kr.progress.targetValue ?? 100,
        aggregationMethod: (kr.progress.aggregationMethod ?? 'Last') as KeyResultCalculationMethod,
        unit: kr.progress.unit ?? null,
      },
      weight: kr.weight,
      sortOrder: kr.sortOrder,
      createdAt: Number(kr.createdAt),
      updatedAt: Number(kr.updatedAt),
    }),
  );

  const goalReviews = (raw.goalReviews || []).map((r) =>
    GoalReview.load({
      id: GoalReviewId.of(r.id),
      goalId: GoalId.of(r.goalId),
      type: r.type as ReviewType,
      title: r.title ?? null,
      rating: r.rating,
      summary: r.summary,
      achievements: r.achievements ?? null,
      challenges: r.challenges ?? null,
      improvements: r.improvements ?? null,
      keyResultSnapshots: r.keyResultSnapshots as KeyResultSnapshotDTO[],
      reviewedAt: Number(r.reviewedAt),
      createdAt: Number(r.createdAt),
      updatedAt: Number(r.updatedAt),
    }),
  );

  const weightSnapshots = (raw.weightSnapshots || []).map((ws) =>
    KeyResultWeightSnapshot.fromDTO(ws),
  );

  return {
    id: GoalId.of(raw.id),
    identityId: IdentityId.of(raw.identityId),
    name: raw.name,
    description: raw.description ?? null,
    feasibilityAnalysis: raw.feasibilityAnalysis ?? null,
    motivation: raw.motivation ?? null,
    status: raw.status as GoalStatus,
    startDate: raw.startDate ? Number(raw.startDate) : null,
    dueDate: raw.dueDate ? Number(raw.dueDate) : null,
    completedAt: raw.completedAt ? Number(raw.completedAt) : null,
    archivedAt: raw.archivedAt ? Number(raw.archivedAt) : null,
    sortOrder: raw.sortOrder,
    reminderConfig,
    version: raw.version ?? 1,
    createdAt: Number(raw.createdAt),
    updatedAt: Number(raw.updatedAt),
    deletedAt: raw.deletedAt ? Number(raw.deletedAt) : null,
    keyResults,
    goalReviews,
    weightSnapshots,
  };
}
