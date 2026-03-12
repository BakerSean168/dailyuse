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
} from '../infrastructure-client/adapters/types';

export { RepositoryClientService } from './repository-client-service';
