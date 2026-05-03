import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { GoalFolder } from '@/domain-server';
import type { IGoalFolderRepository } from '@/domain-server';
import { CreateGoalFolderUseCase } from '../create-goal-folder.use-case';

// ============================================================
// Module mock
// ============================================================

vi.mock('@/domain-server', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    GoalFolder: {
      create: vi.fn(),
    },
  };
});

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

describe('CreateGoalFolderUseCase', () => {
  it('should create a folder and return ok with the client DTO', async () => {
    const folder = createFolderFixture();
    vi.mocked(GoalFolder.create).mockReturnValue(folder);
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new CreateGoalFolderUseCase(folderRepo);

    const result = await useCase.execute('identity-123' as any, {
      name: 'Test Folder',
      description: 'Test description',
      color: '#FF0000',
      icon: 'star',
    });

    expect(result.ok).toBe(true);
    expect(GoalFolder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: 'identity-123',
        name: 'Test Folder',
        description: 'Test description',
        color: '#FF0000',
        icon: 'star',
      }),
    );
    expect(folderRepo.save).toHaveBeenCalledWith(folder);
    if (result.ok) {
      expect(result.data).toEqual({
        id: 'folder-id-1',
        identityId: 'identity-123',
        name: 'Test Folder',
        description: 'Test description',
        color: '#FF0000',
        icon: 'star',
      });
    }
  });

  it('should pass parentFolderId when provided', async () => {
    const folder = createFolderFixture();
    vi.mocked(GoalFolder.create).mockReturnValue(folder);
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new CreateGoalFolderUseCase(folderRepo);

    await useCase.execute('identity-123' as any, {
      name: 'Sub Folder',
      description: null,
      color: '#00FF00',
      icon: 'folder',
      parentFolderId: 'parent-folder-id',
    });

    expect(GoalFolder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parentFolderId: 'parent-folder-id',
      }),
    );
  });

  it('should pass undefined parentFolderId when not provided', async () => {
    const folder = createFolderFixture();
    vi.mocked(GoalFolder.create).mockReturnValue(folder);
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new CreateGoalFolderUseCase(folderRepo);

    await useCase.execute('identity-123' as any, {
      name: 'Root Folder',
      description: 'A root folder',
      color: '#0000FF',
      icon: 'home',
    });

    expect(GoalFolder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parentFolderId: undefined,
      }),
    );
  });

  it('should call toClientDTO on the created folder', async () => {
    const folder = createFolderFixture();
    vi.mocked(GoalFolder.create).mockReturnValue(folder);
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new CreateGoalFolderUseCase(folderRepo);

    await useCase.execute('identity-123' as any, {
      name: 'Test Folder',
      description: null,
      color: '#FF0000',
      icon: 'star',
    });

    expect(folder.toClientDTO).toHaveBeenCalledTimes(1);
  });

  it('should propagate repository save errors', async () => {
    const folder = createFolderFixture();
    vi.mocked(GoalFolder.create).mockReturnValue(folder);
    const folderRepo = createMockRepo<IGoalFolderRepository>({
      save: vi.fn().mockRejectedValue(new Error('Database connection failed')),
    });
    const useCase = new CreateGoalFolderUseCase(folderRepo);

    await expect(
      useCase.execute('identity-123' as any, {
        name: 'Test Folder',
        description: null,
        color: '#FF0000',
        icon: 'star',
      }),
    ).rejects.toThrow('Database connection failed');
  });
});
