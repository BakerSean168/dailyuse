/**
 * Goal Folder HTTP Adapter
 *
 * HTTP implementation of IGoalFolderApiClient using ResultHttpClient.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IGoalFolderApiClient, IResultHttpClient } from '../types';
import type {
  GoalFolderClientDTO,
  QueryGoalFoldersRes,
  CreateGoalFolderReq,
  UpdateGoalFolderReq,
} from '@dailyuse/contracts/goal';

export class GoalFolderHttpAdapter implements IGoalFolderApiClient {
  private readonly baseUrl = '/goal-folders';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async createGoalFolder(
    request: CreateGoalFolderReq,
  ): Promise<Result<GoalFolderClientDTO>> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getGoalFolders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    parentId?: string | null;
  }): Promise<Result<QueryGoalFoldersRes>> {
    return this.httpClient.get(this.baseUrl, { params });
  }

  async getGoalFolderById(
    id: string,
  ): Promise<Result<GoalFolderClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/${id}`);
  }

  async updateGoalFolder(
    id: string,
    request: UpdateGoalFolderReq,
  ): Promise<Result<GoalFolderClientDTO>> {
    return this.httpClient.put(`${this.baseUrl}/${id}`, request);
  }

  async deleteGoalFolder(id: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/${id}`);
  }
}
