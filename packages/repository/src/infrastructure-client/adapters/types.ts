/**
 * Repository Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Repository API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * All methods return Result<T> for consistent error handling.
 * Types imported from @dailyuse/contracts/repository.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';

// Re-export port interfaces from application-client ports
export type {
  IRepositoryApiClient,
  CreateFolderRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
  UploadFileLike,
  UploadResourcesRequest,
} from '../../application-client/ports/repository-api-client.port';

// ============ Transport Client Interfaces ============
// Module only defines what it needs — concrete implementations injected from App layer.

// IResultHttpClient imported from @dailyuse/http-client

/**
 * IPC Client interface (Result-returning).
 * Satisfied by ResultIpcClient from @dailyuse/ipc-client at the App level.
 */
export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}
