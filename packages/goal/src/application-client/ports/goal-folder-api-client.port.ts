/**
 * Goal Folder API Client Port
 *
 * Transport-agnostic interface for Goal Folder API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 */

import type { Result } from '@dailyuse/contracts/result';
import type {
  GoalFolderClientDTO,
  CreateGoalFolderReq,
  UpdateGoalFolderReq,
  QueryGoalFoldersRes,
} from '@dailyuse/contracts/goal';

export interface IGoalFolderApiClient {
  createGoalFolder(request: CreateGoalFolderReq): Promise<Result<GoalFolderClientDTO>>;
  getGoalFolders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    parentId?: string | null;
  }): Promise<Result<QueryGoalFoldersRes>>;
  getGoalFolderById(id: string): Promise<Result<GoalFolderClientDTO>>;
  updateGoalFolder(id: string, request: UpdateGoalFolderReq): Promise<Result<GoalFolderClientDTO>>;
  deleteGoalFolder(id: string): Promise<Result<void>>;
}
