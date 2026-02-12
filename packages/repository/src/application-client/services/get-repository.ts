/**
 * Get Repository
 *
 * 获取仓库详情用例
 */

import type { IRepositoryApiClient } from '../../infrastructure-client/adapters/types';
import { RepositoryContainer } from '../../infrastructure-client/repository.container';
import { Repository } from '../../domain-client/aggregates/Repository';

/**
 * Get Repository
 */
export class GetRepository {
  private static instance: GetRepository;

  private constructor(private readonly apiClient: IRepositoryApiClient) {}

  static createInstance(apiClient?: IRepositoryApiClient): GetRepository {
    const container = RepositoryContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetRepository.instance = new GetRepository(client);
    return GetRepository.instance;
  }

  static getInstance(): GetRepository {
    if (!GetRepository.instance) {
      GetRepository.instance = GetRepository.createInstance();
    }
    return GetRepository.instance;
  }

  static resetInstance(): void {
    GetRepository.instance = undefined as unknown as GetRepository;
  }

  async execute(uuid: string): Promise<Repository> {
    const dto = await this.apiClient.getRepositoryById(uuid);
    return Repository.fromClientDTO(dto);
  }
}

export const getRepository = (uuid: string): Promise<Repository> =>
  GetRepository.getInstance().execute(uuid);
