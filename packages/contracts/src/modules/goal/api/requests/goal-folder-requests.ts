/**
 * Goal Folder Requests
 */

/**
 * 创建文件夹请求
 */
export interface CreateGoalFolderRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentFolderUuid?: string;
}

/**
 * 更新文件夹请求
 */
export interface UpdateGoalFolderRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  parentFolderUuid?: string;
}

/**
 * 查询文件夹请求
 */
export interface QueryGoalFoldersRequest {
  accountUuid: string;
  parentFolderUuid?: string;
  includeSystemFolders?: boolean;
  sortBy?: 'name' | 'createdAt' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
}
