/**
 * Repository Module - Application Client
 *
 * Constructor-injected application service for repository management.
 * Uses Result<T> pattern for consistent error handling.
 */

export { RepositoryClientService } from './repository-client-service';

// Re-export as alias for backward compatibility
export { RepositoryClientService as RepositoryApplicationService } from './repository-client-service';

// Singleton placeholder
let _repositoryApplicationService: any = null;

export function setRepositoryApplicationService(service: any) {
  _repositoryApplicationService = service;
}

export const repositoryApplicationService: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!_repositoryApplicationService) {
      throw new Error('repositoryApplicationService not initialized. Call setRepositoryApplicationService first.');
    }
    return (_repositoryApplicationService as any)[prop];
  }
});
