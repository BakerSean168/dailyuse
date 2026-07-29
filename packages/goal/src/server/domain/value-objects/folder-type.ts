import { FolderType as FolderTypeContract, type FolderType as IFolderType } from '@memoflow/contracts/goal';

export type FolderType = IFolderType & { readonly __brand: unique symbol };

// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@memoflow/contracts).
const VALUES: IFolderType[] = Object.values(FolderTypeContract);

export const FolderType = {
  System: 'System' as FolderType,
  User: 'User' as FolderType,

  of(value: string): FolderType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid FolderType: ${value}`);
    }
    return value as FolderType;
  },

  isValid(value: string): value is FolderType {
    return VALUES.includes(value as IFolderType);
  },

  getAll(): FolderType[] {
    return VALUES as FolderType[];
  },

  isSystem(type: FolderType): boolean {
    return type === this.System;
  },

  isUser(type: FolderType): boolean {
    return type === this.User;
  },
};
