/**
 * List Goal Folders Service (Desktop Main Process)
 *
 * 调用 Application Server 的 listGoalFolders use case
 */

import { ListGoalFolders } from '@dailyuse/application-server/goal';
import type { QueryGoalFoldersRequest, GoalFoldersResponse } from '@dailyuse/contracts/goal';

/**
 * 列出目标文件夹
 * 
 * Desktop版本：直接调用Application Server的Use Case
 * 不需要HTTP请求，直接访问本地SQLite数据库
 */
export async function listGoalFoldersService(
  params: QueryGoalFoldersRequest,
): Promise<GoalFoldersResponse> {
  return ListGoalFolders.getInstance().execute(params);
}

