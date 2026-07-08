import type { IndexStatus as IIndexStatus } from '@dailyuse/contracts/editor';

/**
 * IndexStatus 枚举类型
 */

export type IndexStatus = IIndexStatus & { readonly __brand: unique symbol };

const VALUES: IIndexStatus[] = ['NotIndexed', 'Indexing', 'Indexed', 'Failed', 'Outdated'];

export const IndexStatus = {
  NotIndexed: 'NotIndexed' as IndexStatus,
  Indexing: 'Indexing' as IndexStatus,
  Indexed: 'Indexed' as IndexStatus,
  Failed: 'Failed' as IndexStatus,
  Outdated: 'Outdated' as IndexStatus,

  of(value: string): IndexStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid IndexStatus: ${value}`);
    }
    return value as IndexStatus;
  },

  isValid(value: string): value is IndexStatus {
    return VALUES.includes(value as IIndexStatus);
  },

  getAll(): IndexStatus[] {
    return VALUES as IndexStatus[];
  },

  isIndexed(status: IndexStatus): boolean {
    return status === this.Indexed;
  },

  isIndexing(status: IndexStatus): boolean {
    return status === this.Indexing;
  },

  isError(status: IndexStatus): boolean {
    return status === this.Failed;
  },

  needsIndexing(status: IndexStatus): boolean {
    return status === this.NotIndexed || status === this.Outdated;
  },
};
