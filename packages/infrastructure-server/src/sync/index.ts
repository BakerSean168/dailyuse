/**
 * Sync Module - Infrastructure Server
 *
 * Ports and Adapters for Sync module persistence.
 */

// Ports (Interfaces) - Re-exported from domain-server
export type {
  ISyncProfileRepository,
  SyncProfileQueryOptions,
  ISyncSessionRepository,
  SyncSessionQueryOptions,
  IPendingChangeRepository,
  PendingChangeQueryOptions,
  ISyncConflictRepository,
  SyncConflictQueryOptions,
} from '@dailyuse/domain-server/sync';

// Prisma Adapters
export {
  SyncProfilePrismaRepository,
  SyncSessionPrismaRepository,
  SyncConflictPrismaRepository,
  PendingChangePrismaRepository,
} from './adapters/prisma';

// Memory Adapters
export {
  SyncProfileMemoryRepository,
  SyncSessionMemoryRepository,
  SyncConflictMemoryRepository,
  PendingChangeMemoryRepository,
} from './adapters/memory';
