import { describe, expect, it, vi } from 'vitest';
import type { IRelationRepository } from '../../../../domain';
import {
  CreateRelationUseCase,
  ListRelationsUseCase,
} from '../relation.use-cases';

function mockRepo(): IRelationRepository {
  return {
    create: vi.fn(async (input) => ({
      id: 'r-1',
      subject: input.subject,
      relationType: input.relationType,
      object: input.object,
      createdAt: Date.now(),
    })),
    deleteByIdentityId: vi.fn(async () => undefined),
    findBySubject: vi.fn(async () => []),
    findByObject: vi.fn(async () => []),
  };
}

describe('Relation use cases (R5)', () => {
  it('creates a relation between two subjects', async () => {
    const repo = mockRepo();
    const useCase = new CreateRelationUseCase(repo);

    const result = await useCase.execute('identity-1', {
      subject: { type: 'note', id: 'note-1' },
      relationType: 'references',
      object: { type: 'goal', id: 'goal-1' },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.object).toEqual({ type: 'goal', id: 'goal-1' });
    }
  });

  it('rejects invalid subject types', async () => {
    const useCase = new CreateRelationUseCase(mockRepo());
    const result = await useCase.execute('identity-1', {
      subject: { type: 'note', id: 'n' },
      relationType: 'references',
      object: { type: 'unknown-type' as never, id: 'w' },
    });
    expect(result.ok).toBe(false);
  });

  it('supports reverse lookup (who references this object)', async () => {
    const repo = mockRepo();
    const useCase = new ListRelationsUseCase(repo);

    await useCase.reverse('identity-1', { type: 'goal', id: 'goal-1' });

    expect(repo.findByObject).toHaveBeenCalledWith('identity-1', {
      type: 'goal',
      id: 'goal-1',
    });
  });
});
