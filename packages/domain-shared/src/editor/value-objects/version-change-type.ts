import type { VersionChangeType as IVersionChangeType } from '@dailyuse/contracts/editor';

/**
 * VersionChangeType 枚举类型
 * 
 * 【规范说明：枚举与常量对象规范】
 */

export type VersionChangeType = IVersionChangeType & { readonly __brand: unique symbol };

const VALUES: IVersionChangeType[] = [
  'Create',
  'Edit',
  'Delete',
  'Rename',
  'Move',
  'Merge',
  'Restore',
];

export const VersionChangeType = {
  Create: 'Create' as VersionChangeType,
  Edit: 'Edit' as VersionChangeType,
  Delete: 'Delete' as VersionChangeType,
  Rename: 'Rename' as VersionChangeType,
  Move: 'Move' as VersionChangeType,
  Merge: 'Merge' as VersionChangeType,
  Restore: 'Restore' as VersionChangeType,

  of(value: string): VersionChangeType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid VersionChangeType: ${value}`);
    }
    return value as VersionChangeType;
  },

  isValid(value: string): value is VersionChangeType {
    return VALUES.includes(value as IVersionChangeType);
  },

  getAll(): VersionChangeType[] {
    return VALUES as VersionChangeType[];
  },

  isDestructive(type: VersionChangeType): boolean {
    return type === this.Delete;
  },

  isModification(type: VersionChangeType): boolean {
    return type === this.Edit || type === this.Rename || type === this.Move;
  },

  isRecoverable(type: VersionChangeType): boolean {
    return type !== this.Delete;
  },
};
