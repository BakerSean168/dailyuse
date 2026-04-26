import { describe, expect, it } from 'vitest';
import { GoalFolder } from './goal-folder';

describe('GoalFolder aggregate', () => {
  it('creates folders and validates required input', () => {
    const folder = GoalFolder.create({
      identityId: 'IdentityId_1' as never,
      name: '  Projects  ',
      description: '  Work  ',
      icon: 'folder',
      color: '#2563EB',
      sortOrder: 2,
    });

    expect(folder.name).toBe('Projects');
    expect(folder.description).toBe('Work');
    expect(folder.icon).toBe('folder');
    expect(folder.color).toBe('#2563EB');
    expect(folder.sortOrder).toBe(2);
    expect(folder.goalCount).toBe(0);
    expect(folder.completedGoalCount).toBe(0);

    expect(() => GoalFolder.create({ identityId: '' as never, name: 'x' })).toThrow(
      'Identity ID is required',
    );
    expect(() => GoalFolder.create({ identityId: 'IdentityId_1' as never, name: '   ' })).toThrow(
      'Name is required',
    );
  });

  it('updates mutable fields and protects invalid operations', () => {
    const folder = GoalFolder.create({
      identityId: 'IdentityId_1' as never,
      name: 'Projects',
    });

    folder.rename(' Launch ');
    folder.updateDescription('  New description  ');
    folder.updateIcon(' target ');
    folder.updateColor(' #111827 ');
    folder.updateSortOrder(5);
    folder.moveToParent('GoalFolderId_2' as never);

    expect(folder.name).toBe('Launch');
    expect(folder.description).toBe('New description');
    expect(folder.icon).toBe('target');
    expect(folder.color).toBe('#111827');
    expect(folder.sortOrder).toBe(5);
    expect(folder.parentFolderId).toBe('GoalFolderId_2');

    expect(() => folder.rename('  ')).toThrow('Name cannot be empty');
    expect(() => folder.updateSortOrder(-1)).toThrow('Sort order cannot be negative');

    const systemFolder = GoalFolder.create({
      identityId: 'IdentityId_1' as never,
      name: 'Inbox',
      isSystemFolder: true,
    });
    expect(() => systemFolder.rename('Else')).toThrow('Cannot rename system folder');
    expect(() => systemFolder.softDelete()).toThrow('Cannot delete system folder');
  });

  it('tracks statistics, deletion, restore, and serialization helpers', () => {
    const folder = GoalFolder.create({
      identityId: 'IdentityId_1' as never,
      name: 'Projects',
    });

    folder.updateStatistics(4, 1);
    expect(folder.goalCount).toBe(4);
    expect(folder.completedGoalCount).toBe(1);
    expect(folder.getCompletionRate()).toBe(25);
    expect(folder.isEmpty()).toBe(false);

    folder.incrementGoalCount();
    folder.incrementCompletedCount();
    folder.decrementGoalCount();
    folder.decrementCompletedCount();
    folder.decrementCompletedCount();
    folder.decrementGoalCount();
    folder.decrementGoalCount();
    folder.decrementGoalCount();
    folder.decrementGoalCount();
    expect(folder.goalCount).toBe(0);
    expect(folder.completedGoalCount).toBe(0);

    expect(() => folder.updateStatistics(-1, 0)).toThrow('Counts cannot be negative');
    expect(() => folder.updateStatistics(1, 2)).toThrow(
      'Completed count cannot exceed total count',
    );

    folder.softDelete();
    const deletedAt = folder.deletedAt;
    folder.softDelete();
    expect(folder.deletedAt).toBe(deletedAt);

    folder.restore();
    expect(folder.deletedAt).toBeNull();
    folder.restore();
    expect(folder.deletedAt).toBeNull();

    expect(folder.toServerDTO()).toMatchObject({
      name: 'Projects',
      goalCount: 0,
      completedGoalCount: 0,
    });
    expect(folder.toClientDTO()).toMatchObject({
      displayName: 'Projects',
      displayIcon: 'default-folder-icon',
      completionRate: 0,
      activeGoalCount: 0,
    });
  });

  it('loads existing state and clamps active goal count in client dto', () => {
    const folder = GoalFolder.load({
      id: 'GoalFolderId_1' as never,
      identityId: 'IdentityId_1' as never,
      name: 'Loaded',
      description: null,
      icon: null,
      color: null,
      parentFolderId: null,
      sortOrder: 0,
      isSystemFolder: false,
      folderType: 'User' as never,
      goalCount: 1,
      completedGoalCount: 3,
      createdAt: new Date('2026-04-26T00:00:00.000Z'),
      updatedAt: new Date('2026-04-26T00:00:00.000Z'),
      deletedAt: null,
      version: 2,
    });

    expect(folder.folderType).toBe('User');
    expect(folder.version).toBe(2);
    expect(folder.toClientDTO().activeGoalCount).toBe(0);
  });
});
