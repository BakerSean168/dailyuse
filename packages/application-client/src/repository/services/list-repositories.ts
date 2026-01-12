/**
 * List Repositories
 *
 * 获取仓库列表用例
 */

import type { IRepositoryApiClient } from '@dailyuse/infrastructure-client';
import { RepositoryContainer } from '@dailyuse/infrastructure-client';
import { Repository } from '@dailyuse/domain-client/repository';

/**
 * List Repositories
 */
export class ListRepositories {
  private static instance: ListRepositories;

  private constructor(private readonly apiClient: IRepositoryApiClient) {}

  static createInstance(apiClient?: IRepositoryApiClient): ListRepositories {
    const container = RepositoryContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ListRepositories.instance = new ListRepositories(client);
    return ListRepositories.instance;
  }

  static getInstance(): ListRepositories {
    if (!ListRepositories.instance) {
      ListRepositories.instance = ListRepositories.createInstance();
    }
    return ListRepositories.instance;
  }

  static resetInstance(): void {
    ListRepositories.instance = undefined as unknown as ListRepositories;
  }

  async execute(): Promise<Repository[]> {
    const dtos = await this.apiClient.getRepositories();
    return dtos.map((dto) => Repository.fromClientDTO(dto));
  }
}

export const listRepositories = (): Promise<Repository[]> =>
  ListRepositories.getInstance().execute();
