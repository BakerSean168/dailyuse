import { useAppClientRegistry } from '../providers/app-client-registry-provider';

export function useRepositoryService() {
  return useAppClientRegistry().repositoryService;
}
