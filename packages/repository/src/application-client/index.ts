/**
 * Repository Module - Application Client
 *
 * Constructor-injected application service for repository management.
 * Uses Result<T> pattern for consistent error handling.
 */

// ===== Port Interfaces =====
export type {
  IRepositoryApiClient,
  UploadResourcesRequest,
} from './ports/repository-api-client.port';
export type { RepositoryClientPort } from './repository-client.port';

// ===== Client Service =====
export { RepositoryClientService, createRepositoryClientService } from './repository-client-service';
export { createRepositoryServiceFromHttpClient } from './repository-http-service-factory';
