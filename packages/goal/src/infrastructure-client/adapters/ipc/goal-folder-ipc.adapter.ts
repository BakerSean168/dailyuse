/**
 * Goal Folder IPC Adapter
 *
 * IPC implementation of IGoalFolderApiClient for Electron desktop.
 */

import type { IGoalFolderApiClient } from '../../ports/goal-folder-api-client.port';
import type { IpcClient } from '../../../shared/ipc-client.types';
import type {
  GoalFolderClientDTO,
  GoalFolderListResponse,
  CreateGoalFolderRequest,
  UpdateGoalFolderRequest,
} from '@dailyuse/contracts/goal';

/**
 * Goal Folder IPC Adapter
 */
export class GoalFolderIpcAdapter implements IGoalFolderApiClient {
  private readonly channel = 'goal-folder';

  constructor(private readonly ipcClient: IpcClient) {}

  async createGoalFolder(request: CreateGoalFolderRequest): Promise<GoalFolderClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:create`, request);
  }

  async getGoalFolders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    parentUuid?: string | null;
  }): Promise<GoalFolderListResponse> {
    return this.ipcClient.invoke(`${this.channel}:list`, params);
  }

  async getGoalFolderById(uuid: string): Promise<GoalFolderClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:get`, uuid);
  }

  async updateGoalFolder(
    uuid: string,
    request: UpdateGoalFolderRequest,
  ): Promise<GoalFolderClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:update`, uuid, request);
  }

  async deleteGoalFolder(uuid: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:delete`, uuid);
  }
}

/**
 * Factory function to create GoalFolderIpcAdapter
 */
export function createGoalFolderIpcAdapter(ipcClient: IpcClient): IGoalFolderApiClient {
  return new GoalFolderIpcAdapter(ipcClient);
}
