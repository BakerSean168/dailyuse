import { describe, expect, it } from 'vitest';
import type { TreeNode } from '@dailyuse/contracts/repository';
import { __test__, findNotesFolderId } from './note-folder';

function createFolder(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    id: 'folder-1',
    name: 'notes',
    type: 'folder',
    parentId: null,
    repositoryId: 'repo-1' as TreeNode['repositoryId'],
    path: '/notes',
    children: [],
    ...overrides,
  };
}

describe('noteFolder', () => {
  it('finds the fixed notes folder by canonical path', () => {
    const folder = createFolder({ id: 'notes-folder', path: '/notes' });

    expect(
      findNotesFolderId([
        createFolder({ id: 'images-folder', name: 'images', path: '/images' }),
        folder,
      ]),
    ).toBe('notes-folder');
  });

  it('finds the fixed notes folder in nested tree nodes', () => {
    const nestedFolder = createFolder({
      id: 'notes-folder',
      parentId: 'root-folder' as TreeNode['parentId'],
      path: '/content/notes',
    });

    const root = createFolder({
      id: 'root-folder',
      name: 'content',
      path: '/content',
      children: [nestedFolder],
    });

    expect(findNotesFolderId([root])).toBe('notes-folder');
  });

  it('normalizes backslash paths before matching', () => {
    expect(__test__.normalizeNodePath('\\notes\\daily.md')).toBe('/notes/daily.md');
  });

  it('returns null when no notes folder exists', () => {
    expect(findNotesFolderId([createFolder({ name: 'images', path: '/images' })])).toBeNull();
  });
});
