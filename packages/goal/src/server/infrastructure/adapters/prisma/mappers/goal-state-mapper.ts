/**
 * Goal State Mapper
 *
 * Converts raw persistence data → GoalState for domain reconstruction.
 * Shared by Prisma and PowerSync mappers.
 */

import type { ReviewType, KeyResultWeightSnapshotDTO, KeyResultValueType, KeyResultCalculationMethod, GoalReminderConfigDTO, KeyResultSnapshotDTO } from '@dailyuse/contracts/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { IdentityId } from '@dailyuse/domain-shared';
import { GoalId, GoalFolderId, GoalReviewId, KeyResultId } from '../../../../domain';
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
  color: string;
  feasibilityAnalysis: string | null;
  motivation: string | null;
  status: string;
  importance: string;
  priority: number;
  category: string | null;
  tags: string[];
  startDate: Date | null;
  targetDate: Date | null;
  completedAt: Date | null;
  archivedAt: Date | null;
  folderId: string | null;
  parentGoalId: string | null;
  sortOrder: number;
  reminderConfig: { enabled: boolean; triggers: unknown[] } | null;
  keyResults: RawKeyResultData[] | null;
  goalReviews: RawGoalReviewData[] | null;
  weightSnapshots: KeyResultWeightSnapshotDTO[] | null;
  totalKeyResults?: number;
  completedKeyResults?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export interface RawKeyResultData {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  progress: {
    initialValue: number;
    currentValue: number;
    targetValue: number;
    valueType: string;
    aggregationMethod: string;
    unit: string | null;
  };
  weight: number;
  sortOrder: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface RawGoalReviewData {
  id: string;
  goalId: string;
  type: string;
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  keyResultSnapshots: unknown[];
  reviewedAt: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
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
        initialValue: kr.progress.initialValue ?? 0,
        currentValue: kr.progress.currentValue ?? 0,
        targetValue: kr.progress.targetValue ?? 100,
        valueType: (kr.progress.valueType ?? 'Incremental') as KeyResultValueType,
        aggregationMethod: (kr.progress.aggregationMethod ?? 'Last') as KeyResultCalculationMethod,
        unit: kr.progress.unit ?? null,
      },
      weight: kr.weight,
      sortOrder: kr.sortOrder,
      version: kr.version ?? 1,
      createdAt: new Date(kr.createdAt),
      updatedAt: new Date(kr.updatedAt),
      deletedAt: kr.deletedAt ? new Date(kr.deletedAt) : null,
    }),
  );

  const goalReviews = (raw.goalReviews || []).map((r) =>
    GoalReview.load({
      id: GoalReviewId.of(r.id),
      goalId: GoalId.of(r.goalId),
      type: r.type as ReviewType,
      rating: r.rating,
      summary: r.summary,
      achievements: r.achievements ?? null,
      challenges: r.challenges ?? null,
      improvements: r.improvements ?? null,
      keyResultSnapshots: r.keyResultSnapshots as KeyResultSnapshotDTO[],
      reviewedAt: new Date(r.reviewedAt),
      version: r.version ?? 1,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
      deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
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
    color: raw.color,
    feasibilityAnalysis: raw.feasibilityAnalysis ?? null,
    motivation: raw.motivation ?? null,
    status: raw.status as GoalStatus,
    importance: raw.importance as ImportanceLevel,
    priority: raw.priority ?? 0,
    category: raw.category ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    startDate: raw.startDate ? new Date(raw.startDate) : null,
    targetDate: raw.targetDate ? new Date(raw.targetDate) : null,
    completedAt: raw.completedAt ? new Date(raw.completedAt) : null,
    archivedAt: raw.archivedAt ? new Date(raw.archivedAt) : null,
    folderId: raw.folderId ? GoalFolderId.of(raw.folderId) : null,
    parentGoalId: raw.parentGoalId ? GoalId.of(raw.parentGoalId) : null,
    sortOrder: raw.sortOrder,
    reminderConfig,
    version: raw.version ?? 1,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : null,
    keyResults,
    goalReviews,
    weightSnapshots,
    totalKeyResults: raw.totalKeyResults,
    completedKeyResults: raw.completedKeyResults,
  };
}
