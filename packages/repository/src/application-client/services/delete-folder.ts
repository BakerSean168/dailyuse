/**
 * Delete Folder
 *
 * 删除文件夹用例
 */

import type { IRepositoryApiClient } from '@/infrastructure-client';
import { RepositoryContainer } from '@/infrastructure-client';

/**
 * Delete Folder
 */
export class DeleteFolder {
  private static instance: DeleteFolder;

  private constructor(private readonly apiClient: IRepositoryApiClient) {}

  static createInstance(apiClient?: IRepositoryApiClient): DeleteFolder {
    const container = RepositoryContainer.getInstance();
    const client = apiClient || container.getApiClient();
    DeleteFolder.instance = new DeleteFolder(client);
    return DeleteFolder.instance;
  }

  static getInstance(): DeleteFolder {
    if (!DeleteFolder.instance) {
      DeleteFolder.instance = DeleteFolder.createInstance();
    }
    return DeleteFolder.instance;
  }

  static resetInstance(): void {
    DeleteFolder.instance = undefined as unknown as DeleteFolder;
  }

  async execute(uuid: string): Promise<void> {
    return this.apiClient.deleteFolder(uuid);
  }
}

export const deleteFolder = (uuid: string): Promise<void> =>
  DeleteFolder.getInstance().execute(uuid);
