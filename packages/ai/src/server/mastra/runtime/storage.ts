import type { MastraCompositeStore } from '@mastra/core/storage';
import { LibSQLStore } from '@mastra/libsql';
import { PostgresStore } from '@mastra/pg';

export type MastraStorageConfig =
  | { readonly kind: 'postgres'; readonly connectionString: string; readonly schemaName?: string }
  | { readonly kind: 'libsql'; readonly url: string };

export function createMastraStorage(config: MastraStorageConfig): MastraCompositeStore {
  if (config.kind === 'postgres') {
    return new PostgresStore({
      id: 'memoflow-ai',
      connectionString: config.connectionString,
      schemaName: config.schemaName ?? 'mastra',
    });
  }

  return new LibSQLStore({ id: 'memoflow-ai', url: config.url });
}
