/**
 * RepositoryStatistics Memory Repository
 *
 * In-memory implementation of IRepositoryStatisticsRepository for testing.
 */

import type { IRepositoryStatisticsRepository } from '../../ports/repository-statistics-repository.port';
import type { RepositoryStatistics } from '../../../domain-server/aggregates/repository-statistics';

/**
 * RepositoryStatistics Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class RepositoryStatisticsMemoryRepository implements IRepositoryStatisticsRepository {
  private statistics = new Map<string, RepositoryStatistics>();
  private accountIndex = new Map<string, string>(); // accountUuid -> uuid

  async save(statistics: RepositoryStatistics): Promise<void> {
    const stats = statistics as any;
    this.statistics.set(stats.uuid, statistics);
    this.accountIndex.set(stats.accountUuid, stats.uuid);
  }

  async findByAccountUuid(accountUuid: string): Promise<RepositoryStatistics | null> {
    const uuid = this.accountIndex.get(accountUuid);
    return uuid ? this.statistics.get(uuid) ?? null : null;
  }

  async findByUuid(uuid: string): Promise<RepositoryStatistics | null> {
    return this.statistics.get(uuid) ?? null;
  }

  async findByAccountUuids(accountUuids: string[]): Promise<RepositoryStatistics[]> {
    return accountUuids
      .map((id) => this.accountIndex.get(id))
      .filter((uuid): uuid is string => uuid !== undefined)
      .map((uuid) => this.statistics.get(uuid))
      .filter((s): s is RepositoryStatistics => s !== undefined);
  }

  async findAll(options?: { skip?: number; take?: number }): Promise<RepositoryStatistics[]> {
    const all = Array.from(this.statistics.values());
    const skip = options?.skip ?? 0;
    const take = options?.take ?? all.length;
    return all.slice(skip, skip + take);
  }

  async count(): Promise<number> {
    return this.statistics.size;
  }

  async delete(uuid: string): Promise<void> {
    const stats = this.statistics.get(uuid) as any;
    if (stats) {
      this.accountIndex.delete(stats.accountUuid);
      this.statistics.delete(uuid);
    }
  }

  // Test helpers
  clear(): void {
    this.statistics.clear();
    this.accountIndex.clear();
  }

  seed(statistics: RepositoryStatistics[]): void {
    statistics.forEach((s: any) => {
      this.statistics.set(s.uuid, s);
      this.accountIndex.set(s.accountUuid, s.uuid);
    });
  }
}
