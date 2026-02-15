/**
 * Repository Module - Infrastructure Client
 *
 * Adapters and container for Repository module communication.
 */

// Container
export { RepositoryContainer, RepositoryDependencyKeys } from './repository.container';

// Port Interfaces
export type {
  IRepositoryApiClient,
  CreateRepositoryRequest,
  CreateFolderRequest,
  IIpcClient,
} from './adapters/types';

// HTTP Adapters
export { RepositoryHttpAdapter, createRepositoryHttpAdapters, type RepositoryHttpAdapters } from './adapters/http';

// IPC Adapters
export { RepositoryIpcAdapter, createRepositoryIpcAdapters, type RepositoryIpcAdapters } from './adapters/ipc';
