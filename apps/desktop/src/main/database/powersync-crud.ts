import type { CrudTransaction } from '@powersync/common';

export function serializeCrudTransaction(
  transaction: CrudTransaction,
): ReturnType<CrudTransaction['crud'][number]['toJSON']>[] {
  return transaction.crud.map((op) => op.toJSON());
}
