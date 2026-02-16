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
  private currentId: string | null = null;

  async save(config: any): Promise<void> {
    this.configs.set(config.id, config);
    // Mark as current if it's the newest version
    if (config.isCurrent) {
      this.currentId = config.id;
    }
  }

  async findById(id: string): Promise<any | null> {
    return this.configs.get(id) ?? null;
  }

  async getCurrent(): Promise<any | null> {
    if (this.currentId) {
      return this.configs.get(this.currentId) ?? null;
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

  async delete(id: string): Promise<void> {
    if (this.currentId === id) {
      this.currentId = null;
    }
    this.configs.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.configs.has(id);
  }

  async existsByVersion(version: string): Promise<boolean> {
    return Array.from(this.configs.values()).some((c) => c.version === version);
  }

  // Test helpers
  clear(): void {
    this.configs.clear();
    this.currentId = null;
  }

  seed(configs: any[]): void {
    configs.forEach((c) => this.configs.set(c.id, c));
  }
}
