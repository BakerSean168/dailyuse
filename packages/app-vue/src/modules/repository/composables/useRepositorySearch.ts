/**
 * useRepositorySearch - Search/filter logic for repository resources
 *
 * Extracted from useRepository to isolate search orchestration.
 */

import type {
  ResourceClientDTO,
  SearchRequest,
  SearchResponse,
} from '@dailyuse/contracts/repository';
import type { Result } from '@dailyuse/contracts/result';
import { searchRepositoryResources } from './repositorySearch';
import { isSearchResponse } from './repositoryHelpers';

interface SearchCapableService {
  search?(request: SearchRequest): Promise<Result<unknown>>;
}

interface SearchDependencies {
  service: SearchCapableService;
  executeOperation: <T>(
    operation: () => Promise<Result<T>>,
    fallbackMessage: string,
  ) => Promise<Result<T>>;
  getResources: () => ResourceClientDTO[];
}

export function useRepositorySearch(deps: SearchDependencies) {
  async function searchResources(request: SearchRequest): Promise<SearchResponse> {
    if (typeof deps.service.search === 'function') {
      const result = await deps.executeOperation(
        () => deps.service.search!(request),
        '搜索资源失败',
      );
      if (result.ok && isSearchResponse(result.data)) {
        return result.data;
      }
    }

    return searchRepositoryResources(deps.getResources(), request);
  }

  return { searchResources };
}
