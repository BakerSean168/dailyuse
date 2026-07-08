/**
 * Repository Memory Repository
 *
 * In-memory implementation of IRepositoryRepository for testing.
 */

import type { IRepositoryRepository } from '../../../domain/repositories/i-repository-repository';
import type { Repository } from '../../../domain/aggregates/repository';
import type { RepositoryStatus } from '@dailyuse/contracts/repository';

/**
 * Repository Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class RepositoryMemoryRepository implements IRepositoryRepository {
  private repositories = new Map<string, Repository>();

  async save(repository: Repository): Promise<void> {
    this.repositories.set(String(repository.id), repository);
  }

  async findById(id: string): Promise<Repository | null> {
    return this.repositories.get(id) ?? null;
  }

  async findByIdentityId(identityId: string): Promise<Repository[]> {
    return Array.from(this.repositories.values()).filter((r) => String(r.identityId) === identityId);
  }

  async findByIdentityIdAndStatus(identityId: string, status: RepositoryStatus): Promise<Repository[]> {
    return Array.from(this.repositories.values()).filter(
      (r) => String(r.identityId) === identityId && r.status === status,
    );
  }

  async delete(id: string): Promise<void> {
    this.repositories.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.repositories.has(id);
  }

  async findByAccountId(identityId: string): Promise<Repository[]> {
    return this.findByIdentityId(identityId);
  }

  // Test helpers
  clear(): void {
    this.repositories.clear();
  }

  seed(repositories: Repository[]): void {
    repositories.forEach((r) => this.repositories.set(String(r.id), r));
  }
}
