/**
 * AppConfig Memory Repository
 *
 * In-memory implementation of IAppConfigRepository for testing.
 */

import type { IAppConfigRepository } from '../../ports/app-config-repository.port';

/**
 * AppConfig Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class AppConfigMemoryRepository implements IAppConfigRepository {
  private configs = new Map<string, any>();
  private currentUuid: string | null = null;

  async save(config: any): Promise<void> {
    this.configs.set(config.uuid, config);
    // Mark as current if it's the newest version
    if (config.isCurrent) {
      this.currentUuid = config.uuid;
    }
  }

  async findById(uuid: string): Promise<any | null> {
    return this.configs.get(uuid) ?? null;
  }

  async getCurrent(): Promise<any | null> {
    if (this.currentUuid) {
      return this.configs.get(this.currentUuid) ?? null;
    }
    // Return the most recently added if no current is set
    const all = Array.from(this.configs.values());
    return all.length > 0 ? all[all.length - 1] : null;
  }

  async findByVersion(version: string): Promise<any | null> {
    return Array.from(this.configs.values()).find((c) => c.version === version) ?? null;
  }

  async findAllVersions(): Promise<any[]> {
    return Array.from(this.configs.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  async delete(uuid: string): Promise<void> {
    if (this.currentUuid === uuid) {
      this.currentUuid = null;
    }
    this.configs.delete(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    return this.configs.has(uuid);
  }

  async existsByVersion(version: string): Promise<boolean> {
    return Array.from(this.configs.values()).some((c) => c.version === version);
  }

  // Test helpers
  clear(): void {
    this.configs.clear();
    this.currentUuid = null;
  }

  seed(configs: any[]): void {
    configs.forEach((c) => this.configs.set(c.uuid, c));
  }
}
