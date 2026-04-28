import { describe, it, expect } from 'vitest';
import { PrismaGoalFolderMapper } from './prisma-goal-folder-mapper';

describe('PrismaGoalFolderMapper', () => {
  it('maps prisma row to domain goal folder with defaults', () => {
    const row = {
      id: 'folder-1',
      identityId: 'identity-1',
      name: 'Work',
      description: null,
      icon: null,
      color: '#fff',
      parentFolderId: null,
      sortOrder: undefined,
      folderType: 'User',
      goalCount: undefined,
      completedGoalCount: undefined,
      createdAt: new Date(1_000),
      updatedAt: new Date(2_000),
      deletedAt: null,
      version: undefined,
    } as any;

    const domain = PrismaGoalFolderMapper.toDomain(row);
    const dto = domain.toServerDTO();

    expect(dto.id).toBe('folder-1');
    expect(dto.identityId).toBe('identity-1');
    expect(dto.sortOrder).toBe(0);
    expect(dto.goalCount).toBe(0);
    expect(dto.completedGoalCount).toBe(0);
    expect(dto.isSystemFolder).toBe(false);
    expect(dto.version).toBe(1);
  });

  it('maps list with parent folder and deletedAt', () => {
    const rows = [
      {
        id: 'folder-2',
        identityId: 'identity-1',
        name: 'Nested',
        description: 'desc',
        icon: 'icon',
        color: '#000',
        parentFolderId: 'folder-1',
        sortOrder: 2,
        folderType: 'System',
        goalCount: 3,
        completedGoalCount: 1,
        createdAt: new Date(1_000),
        updatedAt: new Date(2_000),
        deletedAt: new Date(3_000),
        version: 3,
      },
    ] as any[];

    const domains = PrismaGoalFolderMapper.toDomainList(rows);
    const dto = domains[0].toServerDTO();

    expect(domains).toHaveLength(1);
    expect(dto.parentFolderId).toBe('folder-1');
    expect(dto.deletedAt).toBe(3_000);
    expect(dto.version).toBe(3);
  });
});
