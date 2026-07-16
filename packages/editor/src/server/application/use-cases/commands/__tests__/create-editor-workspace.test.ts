import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectType } from '@dailyuse/contracts/editor';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IEditorWorkspaceRepository } from '../../../../domain/repositories/i-editor-workspace-repository';
import { EditorWorkspace } from '../../../../domain/aggregates/editor-workspace';
import { CreateEditorWorkspaceUseCase } from '../create-editor-workspace.use-case';

describe('CreateEditorWorkspaceUseCase', () => {
  let repository: ReturnType<typeof createMockRepo<IEditorWorkspaceRepository>>;
  let useCase: CreateEditorWorkspaceUseCase;

  beforeEach(() => {
    repository = createMockRepo<IEditorWorkspaceRepository>({
      createOrGet: vi.fn(),
    });
    useCase = new CreateEditorWorkspaceUseCase(repository);
  });

  it('returns the persisted workspace selected by the natural key', async () => {
    const identityId = IdentityId.generate();
    const persisted = EditorWorkspace.create({
      identityId,
      name: 'Persisted workspace',
      projectPath: 'repository-1',
      projectType: ProjectType.Other,
    });
    vi.mocked(repository.createOrGet).mockResolvedValue(persisted);

    const result = await useCase.execute({
      identityId,
      name: 'Concurrent candidate',
      projectPath: 'repository-1',
      projectType: ProjectType.Other,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected workspace creation to succeed');
    expect(result.data.id).toBe(persisted.id);
    expect(result.data.name).toBe('Persisted workspace');
    expect(repository.createOrGet).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId,
        projectPath: 'repository-1',
      }),
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('returns one persisted id to every concurrent caller', async () => {
    const identityId = IdentityId.generate();
    const persisted = EditorWorkspace.create({
      identityId,
      name: 'Canonical workspace',
      projectPath: 'repository-1',
      projectType: ProjectType.Other,
    });
    vi.mocked(repository.createOrGet).mockResolvedValue(persisted);

    const results = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        useCase.execute({
          identityId,
          name: `Candidate ${index}`,
          projectPath: 'repository-1',
          projectType: ProjectType.Other,
        }),
      ),
    );

    expect(new Set(results.map((result) => (result.ok ? result.data.id : null)))).toEqual(
      new Set([persisted.id]),
    );
  });
});
