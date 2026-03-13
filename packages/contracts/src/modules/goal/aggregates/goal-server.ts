/**
 * Goal Aggregate Root - Server Contracts
 *
 * Note: The contracts package contains only pure type definitions, no business logic.
 */

import type {
  DomainDate,
  TransferDate,
  PersistenceDate,
  GoalId,
  IdentityId,
  GoalFolderId,
} from '../../../primitives';
import type { ImportanceLevel } from '../../../shared/index';
import type { GoalStatus } from '../value-objects/goal-status';
import type { KeyResultServerDTO, KeyResultPersistenceDTO } from '../entities/key-result-server';
import type { GoalReviewServerDTO, GoalReviewPersistenceDTO } from '../entities/goal-review-server';
import type {
  GoalReminderConfig,
  GoalReminderConfigDTO,
  GoalReminderConfigPersistenceDTO,
} from '../value-objects';
import type { KeyResultWeightSnapshotDTO } from '../value-objects/key-result-weight-snapshot';

// ============ Transfer DTO ============

/** Goal Server DTO for API transfer. */
export interface GoalServerDTO {
  id: GoalId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  color: string;
  feasibilityAnalysis: string | null;
  motivation: string | null;
  status: GoalStatus;
  importance: ImportanceLevel;
  category: string | null;
  tags: string[];
  startDate: TransferDate | null;
  targetDate: TransferDate | null;
  completedAt: TransferDate | null;
  archivedAt: TransferDate | null;
  folderId: GoalFolderId | null;
  parentGoalId: GoalId | null;
  sortOrder: number;
  reminderConfig: GoalReminderConfigDTO | null;

  /** Computed property: dynamic priority score (0-100) */
  priority: number | null;

  keyResults: KeyResultServerDTO[] | null;
  weightSnapshots: KeyResultWeightSnapshotDTO[] | null;
  goalReviews: GoalReviewServerDTO[] | null;

  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

// ============ Persistence DTO ============

/** Goal Persistence DTO for database storage. */
export interface GoalPersistenceDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;
  color: string;
  feasibilityAnalysis: string | null;
  motivation: string | null;
  status: string;
  importance: string;
  /**
   * Dynamic priority score (persisted).
   * Used for high-performance sorting, updated by daily cron job.
   */
  priority: number;
  category: string | null;
  tags: string[];
  startDate: PersistenceDate | null;
  targetDate: PersistenceDate | null;
  completedAt: PersistenceDate | null;
  archivedAt: PersistenceDate | null;
  folderId: string | null;
  parentGoalId: string | null;
  sortOrder: number;
  reminderConfig: GoalReminderConfigPersistenceDTO | null; // JSON string

  keyResults: KeyResultPersistenceDTO[] | null;
  goalReviews: GoalReviewPersistenceDTO[] | null;
  weightSnapshots: KeyResultWeightSnapshotDTO[] | null;
  totalKeyResults?: number;
  completedKeyResults?: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
  version: number;
}
