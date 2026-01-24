/**
 * SyncSession Memory Repository
 *
 * In-memory implementation of ISyncSessionRepository.
 * Used for desktop app (SQLite) and testing.
 */

import {
  SyncSession,
  type ISyncSessionRepository,
  type SyncSessionQueryOptions,
} from '@dailyuse/domain-server/sync';
import { SyncSessionStatus } from '@dailyuse/contracts/sync';

export class SyncSessionMemoryRepository implements ISyncSessionRepository {
  private sessions: Map<string, SyncSession> = new Map();

  async save(session: SyncSession): Promise<void> {
    this.sessions.set(session.uuid, session);
  }

  async findByUuid(uuid: string): Promise<SyncSession | null> {
    return this.sessions.get(uuid) ?? null;
  }

  async findLatestByProfileId(profileId: string): Promise<SyncSession | null> {
    const sessions = Array.from(this.sessions.values())
      .filter((s) => s.profileId === profileId)
      .sort((a, b) => b.createdAt - a.createdAt);
    return sessions[0] ?? null;
  }

  async findInProgress(): Promise<SyncSession[]> {
    const inProgressStatuses = [
      SyncSessionStatus.PENDING,
      SyncSessionStatus.COLLECTING,
      SyncSessionStatus.SYNCING,
      SyncSessionStatus.CONFLICTED,
    ];
    return Array.from(this.sessions.values()).filter((s) =>
      inProgressStatuses.includes(s.status),
    );
  }

  async findByQuery(accountUuid: string, options: SyncSessionQueryOptions): Promise<SyncSession[]> {
    let results = Array.from(this.sessions.values());

    if (options.profileId) {
      results = results.filter((s) => s.profileId === options.profileId);
    }

    if (options.status && options.status.length > 0) {
      results = results.filter((s) => options.status!.includes(s.status));
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

  async count(accountUuid: string, options?: SyncSessionQueryOptions): Promise<number> {
    if (!options) {
      return this.sessions.size;
    }

    let results = Array.from(this.sessions.values());

    if (options.profileId) {
      results = results.filter((s) => s.profileId === options.profileId);
    }

    if (options.status && options.status.length > 0) {
      results = results.filter((s) => options.status!.includes(s.status));
    }

    return results.length;
  }

  async delete(uuid: string): Promise<void> {
    this.sessions.delete(uuid);
  }

  /**
   * Clear all sessions (for testing)
   */
  clear(): void {
    this.sessions.clear();
  }
}
