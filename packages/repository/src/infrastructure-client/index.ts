/**
 * Repository Module - Infrastructure Client
 *
 * Exports:
 * - Container: RepositoryContainer
 * - Ports: IRepositoryApiClient
 * - Adapters: HTTP and IPC implementations
 */

// Container
export { RepositoryContainer, RepositoryDependencyKeys } from './repository.container';

// Ports
export type { IRepositoryApiClient, CreateRepositoryRequest, CreateFolderRequest } from './ports';

// Adapters
export { RepositoryHttpAdapter } from './adapters/http';
export { RepositoryIpcAdapter } from './adapters/ipc';
