/**
 * Goal Time Range Value Object Contracts
 *
 * ADR-037 P8: Instant ≡ TransferDate — domain/DTO are isomorphic type aliases.
 */

import type { Instant, TransferDate } from '../../../primitives';

// ============ Domain Shape ============

/**
 * Goal time range — Instant fields; no Date leakage.
 */
export interface GoalTimeRange {
  startDate: Instant | null;
  dueDate: Instant | null;
  completedAt: Instant | null;
  archivedAt: Instant | null;
}

// ============ Transfer DTO ============

/**
 * P8: truly isomorphic with domain (TransferDate ≡ Instant).
 */
export type GoalTimeRangeDTO = GoalTimeRange;

// Retain TransferDate documentation alias for wire readers.
export type GoalTimeRangeTransfer = {
  startDate: TransferDate | null;
  dueDate: TransferDate | null;
  completedAt: TransferDate | null;
  archivedAt: TransferDate | null;
};
