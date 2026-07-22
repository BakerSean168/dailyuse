/**
 * KR weight snapshot repository interface.
 *
 * Snapshots are immutable append-only audit records, but reads/deletes
 * must still be identity-scoped.
 */

import type { KeyResultWeightSnapshot } from '../value-objects';

export interface SnapshotQueryResult {
  snapshots: KeyResultWeightSnapshot[];
  total: number;
}

export interface IWeightSnapshotRepository {
  save(snapshot: KeyResultWeightSnapshot): Promise<void>;

  saveMany(snapshots: KeyResultWeightSnapshot[]): Promise<void>;

  findByGoal(
    identityId: string,
    goalId: string,
    page?: number,
    pageSize?: number,
  ): Promise<SnapshotQueryResult>;

  findByKeyResult(
    identityId: string,
    keyResultId: string,
    page?: number,
    pageSize?: number,
  ): Promise<SnapshotQueryResult>;

  findByTimeRange(
    identityId: string,
    startTime: number,
    endTime: number,
    page?: number,
    pageSize?: number,
  ): Promise<SnapshotQueryResult>;

  findById(id: string): Promise<KeyResultWeightSnapshot | null>;

  findByIdForIdentity(identityId: string, id: string): Promise<KeyResultWeightSnapshot | null>;

  delete(identityId: string, id: string): Promise<void>;

  deleteByGoal(identityId: string, goalId: string): Promise<void>;

  deleteByKeyResult(identityId: string, keyResultId: string): Promise<void>;
}
