import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IGoalFolderRepository } from '../../../../domain';
import { UpdateGoalFolderUseCase } from '../update-goal-folder.use-case';

// ============================================================
// Helpers
// ============================================================

function createFolderFixture(overrides?: Record<string, any>) {
  return {
    id: 'folder-id-1',
    identityId: 'identity-123',
    name: 'Test Folder',
    description: 'Test description',
    color: '#FF0000',
    icon: 'star',
    rename: vi.fn(),
    updateDescription: vi.fn(),
    updateColor: vi.fn(),
    updateIcon: vi.fn(),
    toClientDTO: vi.fn().mockReturnValue({
      id: 'folder-id-1',
      identityId: 'identity-123',
      name: 'Test Folder',
      description: 'Test description',
      color: '#FF0000',
      icon: 'star',
    }),
    ...overrides,
  } as any;
}

describe('UpdateGoalFolderUseCase', () => {
  it('should update folder name and return ok with the client DTO', async () => {
    const folder = createFolderFixture();
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(folder),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalFolderUseCase(folderRepo);

    const result = await useCase.execute('folder-id-1', 'identity-123', {
      name: 'Updated Folder',
    });

    expect(result.ok).toBe(true);
    expect(folder.rename).toHaveBeenCalledWith('Updated Folder');
    expect(folderRepo.save).toHaveBeenCalledWith(folder);
    if (result.ok) {
      expect(result.data).toEqual(folder.toClientDTO());
    }
  });

  it('should return NOT_FOUND error when folder is not found', async () => {
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalFolderUseCase(folderRepo);

    const result = await useCase.execute('non-existent', 'identity-123', { name: 'Updated' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toContain('Goal folder not found');
    }
    expect(folderRepo.save).not.toHaveBeenCalled();
  });

  it('should return NOT_FOUND error when identity does not own the folder', async () => {
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(null),
    });
    const useCase = new UpdateGoalFolderUseCase(folderRepo);

    const result = await useCase.execute(
      'folder-id-1',
      'identity-other',
      { name: 'x' },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('should update all fields when all are provided', async () => {
    const folder = createFolderFixture();
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(folder),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalFolderUseCase(folderRepo);

    await useCase.execute('folder-id-1', 'identity-123', {
      name: 'New Name',
      description: 'New description',
      color: '#00FF00',
      icon: 'heart',
    });

    expect(folder.rename).toHaveBeenCalledWith('New Name');
    expect(folder.updateDescription).toHaveBeenCalledWith('New description');
    expect(folder.updateColor).toHaveBeenCalledWith('#00FF00');
    expect(folder.updateIcon).toHaveBeenCalledWith('heart');
    expect(folderRepo.save).toHaveBeenCalledWith(folder);
  });

  it('should only update provided fields and skip undefined ones', async () => {
    const folder = createFolderFixture();
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(folder),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalFolderUseCase(folderRepo);

    await useCase.execute('folder-id-1', 'identity-123', {
      color: '#0000FF',
    });

    expect(folder.rename).not.toHaveBeenCalled();
    expect(folder.updateDescription).not.toHaveBeenCalled();
    expect(folder.updateColor).toHaveBeenCalledWith('#0000FF');
    expect(folder.updateIcon).not.toHaveBeenCalled();
  });

  it('should pass empty string when nullable fields are explicitly null', async () => {
    const folder = createFolderFixture();
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(folder),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalFolderUseCase(folderRepo);

    await useCase.execute('folder-id-1', 'identity-123', {
      description: null,
      color: null,
      icon: null,
    } as any);

    expect(folder.updateDescription).toHaveBeenCalledWith('');
    expect(folder.updateColor).toHaveBeenCalledWith('');
    expect(folder.updateIcon).toHaveBeenCalledWith('');
  });
});
