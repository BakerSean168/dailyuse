import { describe, expect, it } from 'vitest';
import { VersionChangeType } from '../version-change-type';

describe('VersionChangeType', () => {
  it('validates type', () => {
    expect(VersionChangeType.isValid('Create')).toBe(true);
    expect(VersionChangeType.isValid('Invalid')).toBe(false);
  });

  it('creates type of valid value', () => {
    expect(VersionChangeType.of('Edit')).toBe('Edit');
  });

  it('throws on invalid value', () => {
    expect(() => VersionChangeType.of('Invalid')).toThrow();
  });

  it('gets all types', () => {
    expect(VersionChangeType.getAll()).toEqual([
      'Create',
      'Edit',
      'Delete',
      'Rename',
      'Move',
      'Merge',
      'Restore',
    ]);
  });

  it('checks type category', () => {
    expect(VersionChangeType.isDestructive(VersionChangeType.Delete)).toBe(true);
    expect(VersionChangeType.isDestructive(VersionChangeType.Edit)).toBe(false);
    expect(VersionChangeType.isModification(VersionChangeType.Rename)).toBe(true);
    expect(VersionChangeType.isModification(VersionChangeType.Edit)).toBe(true);
    expect(VersionChangeType.isModification(VersionChangeType.Move)).toBe(true);
    expect(VersionChangeType.isModification(VersionChangeType.Create)).toBe(false);
    expect(VersionChangeType.isRecoverable(VersionChangeType.Create)).toBe(true);
    expect(VersionChangeType.isRecoverable(VersionChangeType.Delete)).toBe(false);
  });
});
