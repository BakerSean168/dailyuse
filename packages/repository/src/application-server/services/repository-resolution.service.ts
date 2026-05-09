/**
 * RepositoryResolutionService
 *
 * Responsible for canonical repository resolution with active fallback and auto-create.
 */
import type { IRepositoryRepository } from '../../domain-server/repositories/IRepositoryRepository';
import { RepositoryStatus } from '@dailyuse/contracts/repository';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { CreateRepositoryUseCase } from '../use-cases/commands/create-repository.use-case';

export interface RepositoryResolutionServiceDependencies {
  repositoryRepository: IRepositoryRepository;
  createRepository: CreateRepositoryUseCase;
  autoCreateCanonicalRepository: boolean;
}

export class RepositoryResolutionService {
  constructor(private readonly deps: RepositoryResolutionServiceDependencies) {}

  async resolveCanonicalRepository(
    identityId: string,
  ): Promise<Result<RepositoryClientDTO>> {
    const activeRepos = await this.deps.repositoryRepository.findByIdentityIdAndStatus(
      identityId,
      RepositoryStatus.Active,
    );
    const repository =
      activeRepos[0] ?? (await this.deps.repositoryRepository.findByIdentityId(identityId))[0];

    if (!repository) {
      return error('NOT_FOUND', `No repository available for identity: ${identityId}`);
    }

    return ok(repository.toClientDTO());
  }

  async ensureCanonicalRepository(
    identityId: string,
  ): Promise<Result<RepositoryClientDTO>> {
    const existing = await this.resolveCanonicalRepository(identityId);
    if (existing.ok) {
      return existing;
    }

    if (existing.error.code !== 'NOT_FOUND') {
      return existing;
    }

    if (!this.deps.autoCreateCanonicalRepository) {
      return existing;
    }

    const result = await this.deps.createRepository.execute({
      identityId,
      name: 'Knowledge Base',
      type: 'Markdown' as any,
      path: 'knowledge-base',
    });

    if (!result.ok) return result;
    return ok(result.data.repository);
  }
}
