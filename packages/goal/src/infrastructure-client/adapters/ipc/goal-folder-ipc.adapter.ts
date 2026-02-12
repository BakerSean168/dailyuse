/**
 * Goal Folder IPC Adapter
 *
 * IPC implementation of IGoalFolderApiClient using ResultIpcClient.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IGoalFolderApiClient, IResultIpcClient } from '../types';
import type {
  GoalFolderClientDTO,
  QueryGoalFoldersRes,
  CreateGoalFolderReq,
  UpdateGoalFolderReq,
} from '@dailyuse/contracts/goal';

export class GoalFolderIpcAdapter implements IGoalFolderApiClient {
  private readonly channel = 'goal-folder';

  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createGoalFolder(
    request: CreateGoalFolderReq,
  ): Promise<Result<GoalFolderClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:create`, request);
  }

  async getGoalFolders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    parentUuid?: string | null;
  }): Promise<Result<QueryGoalFoldersRes>> {
    return this.ipcClient.invoke(`${this.channel}:list`, params);
  }

  async getGoalFolderById(
    uuid: string,
  ): Promise<Result<GoalFolderClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:get`, uuid);
  }

  async updateGoalFolder(
    uuid: string,
    request: UpdateGoalFolderReq,
  ): Promise<Result<GoalFolderClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:update`, uuid, request);
  }

  async deleteGoalFolder(uuid: string): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:delete`, uuid);
  }
}
