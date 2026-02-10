/**
 * Goal Folder API Client Port Interface
 */

import type {
  GoalFolderClientDTO,
  GoalFolderListResponse,
  CreateGoalFolderRequest,
  UpdateGoalFolderRequest,
} from '@dailyuse/contracts/goal';

/**
 * Goal Folder API Client Interface
 */
export interface IGoalFolderApiClient {
  /** 创建目标目录 */
  createGoalFolder(request: CreateGoalFolderRequest): Promise<GoalFolderClientDTO>;

  /** 获取目标目录列表 */
  getGoalFolders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    parentUuid?: string | null;
  }): Promise<GoalFolderListResponse>;

  /** 获取目标目录详情 */
  getGoalFolderById(uuid: string): Promise<GoalFolderClientDTO>;

  /** 更新目标目录 */
  updateGoalFolder(uuid: string, request: UpdateGoalFolderRequest): Promise<GoalFolderClientDTO>;

  /** 删除目标目录 */
  deleteGoalFolder(uuid: string): Promise<void>;
}
