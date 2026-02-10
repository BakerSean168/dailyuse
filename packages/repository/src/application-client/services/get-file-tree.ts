/**
 * Get File Tree
 *
 * 获取文件树用例
 */

import type { IRepositoryApiClient } from '@/infrastructure-client';
import type { FileTreeResponse } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@/infrastructure-client';

/**
 * Get File Tree
 */
export class GetFileTree {
  private static instance: GetFileTree;

  private constructor(private readonly apiClient: IRepositoryApiClient) {}

  static createInstance(apiClient?: IRepositoryApiClient): GetFileTree {
    const container = RepositoryContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetFileTree.instance = new GetFileTree(client);
    return GetFileTree.instance;
  }

  static getInstance(): GetFileTree {
    if (!GetFileTree.instance) {
      GetFileTree.instance = GetFileTree.createInstance();
    }
    return GetFileTree.instance;
  }

  static resetInstance(): void {
    GetFileTree.instance = undefined as unknown as GetFileTree;
  }

  async execute(repositoryUuid: string): Promise<FileTreeResponse> {
    return this.apiClient.getFileTree(repositoryUuid);
  }
}

export const getFileTree = (repositoryUuid: string): Promise<FileTreeResponse> =>
  GetFileTree.getInstance().execute(repositoryUuid);
