/**
 * Create Folder
 *
 * 创建文件夹用例
 */

import type { IRepositoryApiClient, CreateFolderRequest } from '@/infrastructure-client';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@/infrastructure-client';

/**
 * Create Folder Input
 */
export type CreateFolderInput = CreateFolderRequest;

/**
 * Create Folder
 */
export class CreateFolder {
  private static instance: CreateFolder;

  private constructor(private readonly apiClient: IRepositoryApiClient) {}

  static createInstance(apiClient?: IRepositoryApiClient): CreateFolder {
    const container = RepositoryContainer.getInstance();
    const client = apiClient || container.getApiClient();
    CreateFolder.instance = new CreateFolder(client);
    return CreateFolder.instance;
  }

  static getInstance(): CreateFolder {
    if (!CreateFolder.instance) {
      CreateFolder.instance = CreateFolder.createInstance();
    }
    return CreateFolder.instance;
  }

  static resetInstance(): void {
    CreateFolder.instance = undefined as unknown as CreateFolder;
  }

  async execute(input: CreateFolderInput): Promise<FolderClientDTO> {
    return this.apiClient.createFolder(input);
  }
}

export const createFolder = (input: CreateFolderInput): Promise<FolderClientDTO> =>
  CreateFolder.getInstance().execute(input);
