/**
 * Goal Folder HTTP Adapter
 *
 * HTTP implementation of IGoalFolderApiClient.
 */

import type { IGoalFolderApiClient } from '../../ports/goal-folder-api-client.port';
import type { HttpClient } from '../../../shared/http-client.types';
import type {
  GoalFolderClientDTO,
  GoalFolderListResponse,
  CreateGoalFolderRequest,
  UpdateGoalFolderRequest,
} from '@dailyuse/contracts/goal';

/**
 * Goal Folder HTTP Adapter
 */
export class GoalFolderHttpAdapter implements IGoalFolderApiClient {
  private readonly baseUrl = '/goal-folders';

  constructor(private readonly httpClient: HttpClient) {}

  async createGoalFolder(request: CreateGoalFolderRequest): Promise<GoalFolderClientDTO> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getGoalFolders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    parentUuid?: string | null;
  }): Promise<GoalFolderListResponse> {
    return this.httpClient.get(this.baseUrl, { params });
  }

  async getGoalFolderById(uuid: string): Promise<GoalFolderClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}`);
  }

  async updateGoalFolder(
    uuid: string,
    request: UpdateGoalFolderRequest,
  ): Promise<GoalFolderClientDTO> {
    return this.httpClient.put(`${this.baseUrl}/${uuid}`, request);
  }

  async deleteGoalFolder(uuid: string): Promise<void> {
    return this.httpClient.delete(`${this.baseUrl}/${uuid}`);
  }
}

/**
 * Factory function to create GoalFolderHttpAdapter
 */
export function createGoalFolderHttpAdapter(httpClient: HttpClient): IGoalFolderApiClient {
  return new GoalFolderHttpAdapter(httpClient);
}
