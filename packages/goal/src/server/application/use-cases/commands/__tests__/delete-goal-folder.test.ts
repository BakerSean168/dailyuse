import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IGoalFolderRepository } from '@/server/domain';
import { DeleteGoalFolderUseCase } from '../delete-goal-folder.use-case';

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
    softDelete: vi.fn(),
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

describe('DeleteGoalFolderUseCase', () => {
  it('should soft delete the folder and return ok', async () => {
    const folder = createFolderFixture();
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findById: vi.fn().mockResolvedValue(folder),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new DeleteGoalFolderUseCase(folderRepo);

    const result = await useCase.execute('folder-id-1', 'identity-123');

    expect(result.ok).toBe(true);
    expect(folderRepo.findById).toHaveBeenCalledWith('folder-id-1');
    expect(folder.softDelete).toHaveBeenCalledTimes(1);
    expect(folderRepo.save).toHaveBeenCalledWith(folder);
  });

  it('should return NOT_FOUND error when folder is not found', async () => {
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new DeleteGoalFolderUseCase(folderRepo);

    const result = await useCase.execute('non-existent', 'identity-123');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toContain('Goal folder not found');
    }
    expect(folderRepo.save).not.toHaveBeenCalled();
  });

  it('should return FORBIDDEN error when identity does not own the folder', async () => {
    const folder = createFolderFixture({ identityId: 'other-identity' });
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findById: vi.fn().mockResolvedValue(folder),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new DeleteGoalFolderUseCase(folderRepo);

    const result = await useCase.execute('folder-id-1', 'identity-123');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
      expect(result.error.message).toContain('Unauthorized access');
    }
    expect(folder.softDelete).not.toHaveBeenCalled();
    expect(folderRepo.save).not.toHaveBeenCalled();
  });

  it('should call findById before attempting save', async () => {
    const folder = createFolderFixture();
    const callOrder: string[] = [];
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findById: vi.fn().mockImplementation(async () => {
        callOrder.push('findById');
        return folder;
      }),
      save: vi.fn().mockImplementation(async () => {
        callOrder.push('save');
      }),
    });
    const useCase = new DeleteGoalFolderUseCase(folderRepo);

    await useCase.execute('folder-id-1', 'identity-123');

    expect(callOrder).toEqual(['findById', 'save']);
  });

  it('should propagate repository save errors', async () => {
    const folder = createFolderFixture();
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      findById: vi.fn().mockResolvedValue(folder),
      save: vi.fn().mockRejectedValue(new Error('Database connection failed')),
    });
    const useCase = new DeleteGoalFolderUseCase(folderRepo);

    await expect(useCase.execute('folder-id-1', 'identity-123')).rejects.toThrow(
      'Database connection failed',
    );
  });
});
