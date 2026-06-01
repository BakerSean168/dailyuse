/**
 * Goal Aggregate Root - Server Contracts
 *
 * Note: The contracts package contains only pure type definitions, no business logic.
 */

import type {
  TransferDate,
  GoalId,
  IdentityId,
  GoalFolderId,
} from '../../../primitives';
import type { ImportanceLevel } from '../../../shared/index';
import type { GoalStatus } from '../value-objects/goal-status';
import type { KeyResultServerDTO } from '../entities/key-result-server';
import type { GoalReviewServerDTO } from '../entities/goal-review-server';
import type {
  GoalReminderConfigDTO,
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
