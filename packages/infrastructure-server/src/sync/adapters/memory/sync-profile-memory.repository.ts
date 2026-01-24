/**
 * SyncProfile Memory Repository
 *
 * In-memory implementation of ISyncProfileRepository.
 * Used for desktop app (SQLite) and testing.
 */

import {
  SyncProfile,
  type ISyncProfileRepository,
  type SyncProfileQueryOptions,
} from '@dailyuse/domain-server/sync';

export class SyncProfileMemoryRepository implements ISyncProfileRepository {
  private profiles: Map<string, SyncProfile> = new Map();

  async save(profile: SyncProfile): Promise<void> {
    this.profiles.set(profile.uuid, profile);
  }

  async findByUuid(uuid: string): Promise<SyncProfile | null> {
    return this.profiles.get(uuid) ?? null;
  }

  async findDefault(): Promise<SyncProfile | null> {
    return (
      Array.from(this.profiles.values()).find((p) => p.isDefault) ?? null
    );
  }

  async findAll(): Promise<SyncProfile[]> {
    return Array.from(this.profiles.values()).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }

  async findActive(): Promise<SyncProfile[]> {
    return Array.from(this.profiles.values())
      .filter((p) => p.isActive)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async findByQuery(accountUuid: string, options: SyncProfileQueryOptions): Promise<SyncProfile[]> {
    let results = Array.from(this.profiles.values());

    if (options.providerType) {
      results = results.filter((p) => p.providerType === options.providerType);
    }

    if (options.isActive !== undefined) {
      results = results.filter((p) => p.isActive === options.isActive);
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

  async count(accountUuid: string, options?: SyncProfileQueryOptions): Promise<number> {
    if (!options) {
      return this.profiles.size;
    }

    let results = Array.from(this.profiles.values());

    if (options.providerType) {
      results = results.filter((p) => p.providerType === options.providerType);
    }

    if (options.isActive !== undefined) {
      results = results.filter((p) => p.isActive === options.isActive);
    }

    return results.length;
  }

  async delete(uuid: string): Promise<void> {
    this.profiles.delete(uuid);
  }

  async existsByName(name: string, excludeUuid?: string): Promise<boolean> {
    return Array.from(this.profiles.values()).some(
      (p) => p.name === name && p.uuid !== excludeUuid,
    );
  }

  /**
   * Clear all profiles (for testing)
   */
  clear(): void {
    this.profiles.clear();
  }
}
