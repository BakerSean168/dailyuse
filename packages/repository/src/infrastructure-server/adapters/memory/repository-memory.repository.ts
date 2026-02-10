/**
 * Repository Memory Repository
 *
 * In-memory implementation of IRepositoryRepository for testing.
 */

import type { IRepositoryRepository } from '../../ports/repository-repository.port';
import type { Repository } from '@/domain-server';
import type { RepositoryStatus } from '@dailyuse/contracts/repository';

/**
 * Repository Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class RepositoryMemoryRepository implements IRepositoryRepository {
  private repositories = new Map<string, Repository>();

  async save(repository: Repository): Promise<void> {
    this.repositories.set((repository as any).uuid, repository);
  }

  async findByUuid(uuid: string): Promise<Repository | null> {
    return this.repositories.get(uuid) ?? null;
  }

  async findByAccountUuid(accountUuid: string): Promise<Repository[]> {
    return Array.from(this.repositories.values()).filter((r: any) => r.accountUuid === accountUuid);
  }

  async findByAccountUuidAndStatus(accountUuid: string, status: RepositoryStatus): Promise<Repository[]> {
    return Array.from(this.repositories.values()).filter(
      (r: any) => r.accountUuid === accountUuid && r.status === status,
    );
  }

  async delete(uuid: string): Promise<void> {
    this.repositories.delete(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    return this.repositories.has(uuid);
  }

  // Test helpers
  clear(): void {
    this.repositories.clear();
  }

  seed(repositories: Repository[]): void {
    repositories.forEach((r: any) => this.repositories.set(r.uuid, r));
  }
}
