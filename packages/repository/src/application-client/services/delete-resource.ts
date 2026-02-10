/**
 * Delete Resource
 *
 * 删除资源用例
 */

import type { IRepositoryApiClient } from '@/infrastructure-client';
import { RepositoryContainer } from '@/infrastructure-client';

/**
 * Delete Resource
 */
export class DeleteResource {
  private static instance: DeleteResource;

  private constructor(private readonly apiClient: IRepositoryApiClient) {}

  static createInstance(apiClient?: IRepositoryApiClient): DeleteResource {
    const container = RepositoryContainer.getInstance();
    const client = apiClient || container.getApiClient();
    DeleteResource.instance = new DeleteResource(client);
    return DeleteResource.instance;
  }

  static getInstance(): DeleteResource {
    if (!DeleteResource.instance) {
      DeleteResource.instance = DeleteResource.createInstance();
    }
    return DeleteResource.instance;
  }

  static resetInstance(): void {
    DeleteResource.instance = undefined as unknown as DeleteResource;
  }

  async execute(uuid: string): Promise<void> {
    return this.apiClient.deleteResource(uuid);
  }
}

export const deleteResource = (uuid: string): Promise<void> =>
  DeleteResource.getInstance().execute(uuid);
