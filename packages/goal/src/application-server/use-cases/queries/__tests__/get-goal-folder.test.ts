import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils';
import type { IGoalFolderRepository } from '@/domain-server';
import { GetGoalFolderUseCase } from '../get-goal-folder.use-case';

// ============================================================
// Helpers
// ============================================================

function createFolderFixture(overrides?: Record<string, any>) {
  const dto = {
    id: overrides?.id ?? 'folder-id-1',
    name: overrides?.name ?? 'Test Folder',
    identityId: overrides?.identityId ?? 'identity-1',
    parentFolderId: overrides?.parentFolderId ?? null,
  };
  return {
    ...dto,
    toClientDTO: vi.fn().mockReturnValue(dto),
    ...overrides,
  } as any;
}

// ============================================================
// Tests
// ============================================================

describe('GetGoalFolderUseCase', () => {
  it('should return ok with folder DTO by ID', async () => {
    const folder = createFolderFixture();
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findById: vi.fn().mockResolvedValue(folder),
    });
    const useCase = new GetGoalFolderUseCase(folderRepo);

    const result = await useCase.execute('folder-id-1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        id: 'folder-id-1',
        name: 'Test Folder',
        identityId: 'identity-1',
        parentFolderId: null,
      });
    }
    expect(folder.toClientDTO).toHaveBeenCalled();
  });

  it('should return NOT_FOUND error when folder does not exist', async () => {
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findById: vi.fn().mockResolvedValue(null),
    });
    const useCase = new GetGoalFolderUseCase(folderRepo);

    const result = await useCase.execute('non-existent');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toContain('Goal folder not found');
    }
  });

  it('should call findById with the correct ID', async () => {
    const folder = createFolderFixture({ id: 'specific-id' });
    const findById = vi.fn().mockResolvedValue(folder);
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findById,
    });
    const useCase = new GetGoalFolderUseCase(folderRepo);

    await useCase.execute('specific-id');

    expect(findById).toHaveBeenCalledWith('specific-id');
  });

  it('should return the DTO produced by toClientDTO', async () => {
    const customDTO = {
      id: 'custom-folder',
      name: 'Custom Folder',
      identityId: 'identity-2',
      parentFolderId: 'parent-1',
    };
    const folder = createFolderFixture({
      toClientDTO: vi.fn().mockReturnValue(customDTO),
    });
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findById: vi.fn().mockResolvedValue(folder),
    });
    const useCase = new GetGoalFolderUseCase(folderRepo);

    const result = await useCase.execute('custom-folder');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(customDTO);
    }
  });
});
