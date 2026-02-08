/**
 * RuleRevision Entity DTOs
 * 
 * Immutable audit record for Rule changes
 */

import type { TransferDate } from '@dailyuse/contracts/shared';

/**
 * RuleRevisionDTO - Client/Server representation
 */
export interface RuleRevisionDTO {
  id: string;
  ruleId: string;
  revisionNumber: number;
  authorId: string;
  changedFields: string[];
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';
  createdAt: TransferDate;
}

/**
 * RuleRevisionPersistenceDTO - Database representation
 */
export interface RuleRevisionPersistenceDTO {
  id: string;
  ruleId: string;
  revisionNumber: number;
  authorId: string;
  changedFields: string; // JSON array
  previousValues: string | null; // JSON object
  newValues: string | null; // JSON object
  changeType: string;
  createdAt: Date;
}
