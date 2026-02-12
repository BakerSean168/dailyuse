/**
 * Get Resource
 *
 * 获取资源详情用例
 */

import type { IRepositoryApiClient } from '../../infrastructure-client/adapters/types';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '../../infrastructure-client/repository.container';

/**
 * Get Resource
 */
export class GetResource {
  private static instance: GetResource;

  private constructor(private readonly apiClient: IRepositoryApiClient) {}

  static createInstance(apiClient?: IRepositoryApiClient): GetResource {
    const container = RepositoryContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetResource.instance = new GetResource(client);
    return GetResource.instance;
  }

  static getInstance(): GetResource {
    if (!GetResource.instance) {
      GetResource.instance = GetResource.createInstance();
    }
    return GetResource.instance;
  }

  static resetInstance(): void {
    GetResource.instance = undefined as unknown as GetResource;
  }

  async execute(uuid: string): Promise<ResourceClientDTO> {
    return this.apiClient.getResource(uuid);
  }
}

export const getResource = (uuid: string): Promise<ResourceClientDTO> =>
  GetResource.getInstance().execute(uuid);
