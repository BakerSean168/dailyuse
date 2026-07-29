/**
 * Portable Data Runtime Types — V1
 *
 * Runtime-only helpers and context types for data portability.
 * Public DTO types live in @memoflow/contracts/data-portability.
 */

// ============ Ref Allocator ============

export class RefAllocator {
  private counters = new Map<string, number>();

  allocate(prefix: string): string {
    const count = (this.counters.get(prefix) ?? 0) + 1;
    this.counters.set(prefix, count);
    return `${prefix}:${count}`;
  }
}

// ============ Import Types ============

export type RefMap = Map<string, string>;

export interface ImportContext {
  identityId: string;
  batchId: string;
  refMap: RefMap;
  created: Record<string, number>;
  updatedSingletons: Record<string, number>;
  skipped: Record<string, number>;
  warnings: string[];
}

export interface ExportContext {
  identityId: string;
  exportedAt: string;
  refAllocator: RefAllocator;
  warnings: string[];
  refToIdMap: Map<string, string>;
}
