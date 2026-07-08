import { describe, expect, it } from 'vitest';
import { RepositoryResolutionService } from '../services/repository-resolution.service';
import { CreateRepositoryUseCase } from '../use-cases/commands/create-repository.use-case';
import { Repository } from '../../domain/aggregates/repository';
import { createRepositoryMemoryTestRepositories } from '../../../testing';

describe('RepositoryResolutionService', () => {
  it('resolves the active repository for an identity', async () => {
    const { repositoryRepository } = createRepositoryMemoryTestRepositories();
    const createRepository = new CreateRepositoryUseCase(repositoryRepository);

    const repository = Repository.create({
      identityId: 'user-1' as any,
      name: 'Repo',
      type: 'personal' as any,
      path: '/repo',
    });
    await repositoryRepository.save(repository);

    const service = new RepositoryResolutionService({
      repositoryRepository,
      createRepository,
      autoCreateCanonicalRepository: true,
    });

    const result = await service.resolveCanonicalRepository('user-1');
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected success');
    expect(result.data.id).toBe(String(repository.id));
  });

  it('falls back to any repository when no active one exists', async () => {
    const { repositoryRepository } = createRepositoryMemoryTestRepositories();
    const createRepository = new CreateRepositoryUseCase(repositoryRepository);

    const repository = Repository.create({
      identityId: 'user-1' as any,
      name: 'Archived Repo',
      type: 'personal' as any,
      path: '/repo',
    });
    repository.archive();
    await repositoryRepository.save(repository);

    const service = new RepositoryResolutionService({
      repositoryRepository,
      createRepository,
      autoCreateCanonicalRepository: true,
    });

    const result = await service.resolveCanonicalRepository('user-1');
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected success');
    expect(result.data.id).toBe(String(repository.id));
  });

  it('returns NOT_FOUND when no repository exists and auto-create is disabled', async () => {
    const { repositoryRepository } = createRepositoryMemoryTestRepositories();
    const createRepository = new CreateRepositoryUseCase(repositoryRepository);

    const service = new RepositoryResolutionService({
      repositoryRepository,
      createRepository,
      autoCreateCanonicalRepository: false,
    });

    const result = await service.ensureCanonicalRepository('nonexistent-user');
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected failure');
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('auto-creates a canonical repository when none exists', async () => {
    const { repositoryRepository } = createRepositoryMemoryTestRepositories();
    const createRepository = new CreateRepositoryUseCase(repositoryRepository);

    const service = new RepositoryResolutionService({
      repositoryRepository,
      createRepository,
      autoCreateCanonicalRepository: true,
    });

    const result = await service.ensureCanonicalRepository('new-user');
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected success');
    expect(result.data.name).toBe('Knowledge Base');
    expect(result.data.identityId).toBe('new-user');
  });

  it('returns existing repository on ensureCanonicalRepository when one exists', async () => {
    const { repositoryRepository } = createRepositoryMemoryTestRepositories();
    const createRepository = new CreateRepositoryUseCase(repositoryRepository);

    const repository = Repository.create({
      identityId: 'user-1' as any,
      name: 'My Repo',
      type: 'personal' as any,
      path: '/repo',
    });
    await repositoryRepository.save(repository);

    const service = new RepositoryResolutionService({
      repositoryRepository,
      createRepository,
      autoCreateCanonicalRepository: true,
    });

    const result = await service.ensureCanonicalRepository('user-1');
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected success');
    expect(result.data.name).toBe('My Repo');
  });
});
