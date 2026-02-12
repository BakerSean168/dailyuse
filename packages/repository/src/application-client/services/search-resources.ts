/**
 * Search Resources
 *
 * 搜索资源用例
 */

import type { IRepositoryApiClient } from '../../infrastructure-client/adapters/types';
import type { SearchRequest, SearchResponse } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '../../infrastructure-client/repository.container';

/**
 * Search Resources Input
 */
export type SearchResourcesInput = SearchRequest;

/**
 * Search Resources
 */
export class SearchResources {
  private static instance: SearchResources;

  private constructor(private readonly apiClient: IRepositoryApiClient) {}

  static createInstance(apiClient?: IRepositoryApiClient): SearchResources {
    const container = RepositoryContainer.getInstance();
    const client = apiClient || container.getApiClient();
    SearchResources.instance = new SearchResources(client);
    return SearchResources.instance;
  }

  static getInstance(): SearchResources {
    if (!SearchResources.instance) {
      SearchResources.instance = SearchResources.createInstance();
    }
    return SearchResources.instance;
  }

  static resetInstance(): void {
    SearchResources.instance = undefined as unknown as SearchResources;
  }

  async execute(input: SearchResourcesInput): Promise<SearchResponse> {
    return this.apiClient.search(input);
  }
}

export const searchResources = (input: SearchResourcesInput): Promise<SearchResponse> =>
  SearchResources.getInstance().execute(input);
