/**
 * SyncConflict Memory Repository
 *
 * In-memory implementation of ISyncConflictRepository.
 * Used for desktop app (SQLite) and testing.
 */

import {
  SyncConflict,
  type ISyncConflictRepository,
  type SyncConflictQueryOptions,
} from '@dailyuse/domain-server/sync';
import { ConflictStatus } from '@dailyuse/contracts/sync';

export class SyncConflictMemoryRepository implements ISyncConflictRepository {
  private conflicts: Map<string, SyncConflict> = new Map();

  async save(conflict: SyncConflict): Promise<void> {
    this.conflicts.set(conflict.uuid, conflict);
  }

  async saveMany(conflicts: SyncConflict[]): Promise<void> {
    for (const conflict of conflicts) {
      this.conflicts.set(conflict.uuid, conflict);
    }
  }

  async findByUuid(uuid: string): Promise<SyncConflict | null> {
    return this.conflicts.get(uuid) ?? null;
  }

  async findBySessionId(sessionId: string): Promise<SyncConflict[]> {
    return Array.from(this.conflicts.values())
      .filter((c) => c.sessionId === sessionId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async findUnresolved(sessionId?: string): Promise<SyncConflict[]> {
    let results = Array.from(this.conflicts.values()).filter(
      (c) => c.status === ConflictStatus.UNRESOLVED,
    );

    if (sessionId) {
      results = results.filter((c) => c.sessionId === sessionId);
    }

    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  async findAutoResolvable(sessionId: string): Promise<SyncConflict[]> {
    return Array.from(this.conflicts.values())
      .filter(
        (c) =>
          c.sessionId === sessionId &&
          c.status === ConflictStatus.UNRESOLVED &&
          c.autoResolvable,
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async findByQuery(accountUuid: string, options: SyncConflictQueryOptions): Promise<SyncConflict[]> {
    let results = Array.from(this.conflicts.values());

    if (options.sessionId) {
      results = results.filter((c) => c.sessionId === options.sessionId);
    }

    if (options.entityType) {
      results = results.filter((c) => c.entityRef.entityType === options.entityType);
    }

    if (options.status) {
      results = results.filter((c) => c.status === options.status);
    }

    if (options.conflictType) {
      results = results.filter((c) => c.conflictType === options.conflictType);
    }

    if (options.autoResolvable !== undefined) {
      results = results.filter((c) => c.autoResolvable === options.autoResolvable);
    }

    // Sort by createdAt descending
    results.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    if (options.offset) {
      results = results.slice(options.offset);
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  async count(accountUuid: string, options?: SyncConflictQueryOptions): Promise<number> {
    if (!options) {
      return this.conflicts.size;
    }

    let results = Array.from(this.conflicts.values());

    if (options.sessionId) {
      results = results.filter((c) => c.sessionId === options.sessionId);
    }

    if (options.entityType) {
      results = results.filter((c) => c.entityRef.entityType === options.entityType);
    }

    if (options.status) {
      results = results.filter((c) => c.status === options.status);
    }

    if (options.conflictType) {
      results = results.filter((c) => c.conflictType === options.conflictType);
    }

    if (options.autoResolvable !== undefined) {
      results = results.filter((c) => c.autoResolvable === options.autoResolvable);
    }

    return results.length;
  }

  async delete(uuid: string): Promise<void> {
    this.conflicts.delete(uuid);
  }

  async deleteBySessionId(sessionId: string): Promise<number> {
    const toDelete = Array.from(this.conflicts.values()).filter(
      (c) => c.sessionId === sessionId,
    );
    for (const conflict of toDelete) {
      this.conflicts.delete(conflict.uuid);
    }
    return toDelete.length;
  }

  /**
   * Clear all conflicts (for testing)
   */
  clear(): void {
    this.conflicts.clear();
  }
}
