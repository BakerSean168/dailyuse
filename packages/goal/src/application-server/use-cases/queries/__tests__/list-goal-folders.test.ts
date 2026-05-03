import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils';
import type { IGoalFolderRepository } from '@/domain-server';
import { ListGoalFoldersUseCase } from '../list-goal-folders.use-case';

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

describe('ListGoalFoldersUseCase', () => {
  it('should return ok with all folders for an identity', async () => {
    const folder1 = createFolderFixture({ id: 'folder-1', name: 'Folder One' });
    const folder2 = createFolderFixture({ id: 'folder-2', name: 'Folder Two' });
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findByIdentityId: vi.fn().mockResolvedValue([folder1, folder2]),
    });
    const useCase = new ListGoalFoldersUseCase(folderRepo);

    const result = await useCase.execute({ identityId: 'identity-1' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.data).toHaveLength(2);
      expect(result.data.total).toBe(2);
    }
    expect(folder1.toClientDTO).toHaveBeenCalled();
    expect(folder2.toClientDTO).toHaveBeenCalled();
  });

  it('should return ok with empty list when no folders exist', async () => {
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findByIdentityId: vi.fn().mockResolvedValue([]),
    });
    const useCase = new ListGoalFoldersUseCase(folderRepo);

    const result = await useCase.execute({ identityId: 'identity-1' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.data).toHaveLength(0);
      expect(result.data.total).toBe(0);
    }
  });

  it('should call findByIdentityId with the correct identity', async () => {
    const findByIdentityId = vi.fn().mockResolvedValue([]);
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findByIdentityId,
    });
    const useCase = new ListGoalFoldersUseCase(folderRepo);

    await useCase.execute({ identityId: 'specific-identity' });

    expect(findByIdentityId).toHaveBeenCalledWith('specific-identity');
  });

  it('should return DTOs produced by toClientDTO', async () => {
    const customDTO = { id: 'custom', name: 'Custom', identityId: 'id-1', parentFolderId: null };
    const folder = createFolderFixture({
      toClientDTO: vi.fn().mockReturnValue(customDTO),
    });
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findByIdentityId: vi.fn().mockResolvedValue([folder]),
    });
    const useCase = new ListGoalFoldersUseCase(folderRepo);

    const result = await useCase.execute({ identityId: 'identity-1' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.data[0]).toEqual(customDTO);
      expect(result.data.total).toBe(1);
    }
  });

  it('should set total to match the number of folders', async () => {
    const folders = Array.from({ length: 3 }, (_, i) => createFolderFixture({ id: `folder-${i}` }));
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findByIdentityId: vi.fn().mockResolvedValue(folders),
    });
    const useCase = new ListGoalFoldersUseCase(folderRepo);

    const result = await useCase.execute({ identityId: 'identity-1' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.total).toBe(3);
      expect(result.data.data).toHaveLength(3);
    }
  });
});
