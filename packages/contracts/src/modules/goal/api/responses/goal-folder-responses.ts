/**
 * Goal Folder Responses
 */
import type { GoalFolderClientDTO } from '../../aggregates';

/**
 * 文件夹响应
 */
export interface GoalFolderResponse {
  folder: GoalFolderClientDTO;
}

/**
 * 文件夹列表响应
 */
export interface GoalFoldersResponse {
  folders: GoalFolderClientDTO[];
  total: number;
}

/**
 * 兼容性别名
 */
export type GoalFolderListResponse = GoalFoldersResponse;
