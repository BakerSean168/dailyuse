/**
 * PendingChange Memory Repository
 *
 * In-memory implementation of IPendingChangeRepository.
 * Used for desktop app (SQLite) and testing.
 */

import {
  PendingChange,
  type IPendingChangeRepository,
  type PendingChangeQueryOptions,
} from '@dailyuse/domain-server/sync';
import type { SyncableEntityType } from '@dailyuse/contracts/sync';

export class PendingChangeMemoryRepository implements IPendingChangeRepository {
  private changes: Map<string, PendingChange> = new Map();

  async save(change: PendingChange): Promise<void> {
    this.changes.set(change.uuid, change);
  }

  async saveMany(changes: PendingChange[]): Promise<void> {
    for (const change of changes) {
      this.changes.set(change.uuid, change);
    }
  }

  async findByUuid(uuid: string): Promise<PendingChange | null> {
    return this.changes.get(uuid) ?? null;
  }

  async findUnsyncedByEntityRef(
    entityType: SyncableEntityType,
    entityUuid: string,
  ): Promise<PendingChange[]> {
    return Array.from(this.changes.values())
      .filter(
        (c) =>
          !c.isSynced &&
          c.entityRef.entityType === entityType &&
          c.entityRef.entityUuid === entityUuid,
      )
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async findAllUnsynced(limit?: number): Promise<PendingChange[]> {
    let results = Array.from(this.changes.values())
      .filter((c) => !c.isSynced)
      .sort((a, b) => a.createdAt - b.createdAt);

    if (limit) {
      results = results.slice(0, limit);
    }

    return results;
  }

  async findByQuery(options: PendingChangeQueryOptions): Promise<PendingChange[]> {
    let results = Array.from(this.changes.values());

    if (options.entityType) {
      results = results.filter(
        (c) => c.entityRef.entityType === options.entityType,
      );
    }

    if (options.entityUuid) {
      results = results.filter(
        (c) => c.entityRef.entityUuid === options.entityUuid,
      );
    }

    if (options.operation) {
      results = results.filter((c) => c.operation === options.operation);
    }

    if (options.isSynced !== undefined) {
      results = results.filter((c) => c.isSynced === options.isSynced);
    }

    // Sort by createdAt ascending (oldest first)
    results.sort((a, b) => a.createdAt - b.createdAt);

    // Apply pagination
    if (options.offset) {
      results = results.slice(options.offset);
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  async count(options?: PendingChangeQueryOptions): Promise<number> {
    if (!options) {
      return this.changes.size;
    }

    let results = Array.from(this.changes.values());

    if (options.entityType) {
      results = results.filter(
        (c) => c.entityRef.entityType === options.entityType,
      );
    }

    if (options.entityUuid) {
      results = results.filter(
        (c) => c.entityRef.entityUuid === options.entityUuid,
      );
    }

    if (options.operation) {
      results = results.filter((c) => c.operation === options.operation);
    }

    if (options.isSynced !== undefined) {
      results = results.filter((c) => c.isSynced === options.isSynced);
    }

    return results.length;
  }

  async delete(uuid: string): Promise<void> {
    this.changes.delete(uuid);
  }

  async deleteMany(uuids: string[]): Promise<void> {
    for (const uuid of uuids) {
      this.changes.delete(uuid);
    }
  }

  async deleteSynced(): Promise<number> {
    const syncedUuids = Array.from(this.changes.values())
      .filter((c) => c.isSynced)
      .map((c) => c.uuid);

    for (const uuid of syncedUuids) {
      this.changes.delete(uuid);
    }

    return syncedUuids.length;
  }

  /**
   * Clear all changes (for testing)
   */
  clear(): void {
    this.changes.clear();
  }
}
