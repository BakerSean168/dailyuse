/**
 * Repository Module - Infrastructure Client
 *
 * Adapters for Repository module communication.
 */

// Port Interfaces
export type {
  IRepositoryApiClient,
  CreateRepositoryRequest,
  CreateFolderRequest,
  IResultIpcClient,
  UploadResourcesRequest,
  UploadFileLike,
} from './adapters/types';

// HTTP Adapters
export {
  RepositoryHttpAdapter,
  createRepositoryHttpAdapters,
  type RepositoryHttpAdapters,
} from './adapters/http';

// IPC Adapters
export {
  RepositoryIpcAdapter,
  createRepositoryIpcAdapters,
  type RepositoryIpcAdapters,
} from './adapters/ipc';
