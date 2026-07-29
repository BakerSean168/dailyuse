/**
 * Goal Folder IPC Adapter
 *
 * IPC implementation of IGoalFolderApiClient using ResultIpcClient.
 */

import type { Result } from '@memoflow/contracts/result';
import { GoalChannels } from '@memoflow/contracts/electron';
import type { IGoalFolderApiClient, IResultIpcClient } from '../types';
import type {
  GoalFolderClientDTO,
  QueryGoalFoldersRes,
  CreateGoalFolderReq,
  UpdateGoalFolderReq,
} from '@memoflow/contracts/goal';

export class GoalFolderIpcAdapter implements IGoalFolderApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createGoalFolder(
    request: CreateGoalFolderReq,
  ): Promise<Result<GoalFolderClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.FOLDER_CREATE, request);
  }

  async getGoalFolders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    parentId?: string | null;
  }): Promise<Result<QueryGoalFoldersRes>> {
    return this.ipcClient.invoke(GoalChannels.FOLDER_LIST, params);
  }

  async getGoalFolderById(
    id: string,
  ): Promise<Result<GoalFolderClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.FOLDER_GET, id);
  }

  async updateGoalFolder(
    id: string,
    request: UpdateGoalFolderReq,
  ): Promise<Result<GoalFolderClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.FOLDER_UPDATE, id, request);
  }

  async deleteGoalFolder(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke(GoalChannels.FOLDER_DELETE, id);
  }
}
