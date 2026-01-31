/**
 * 文件夹类型
 */
export const FolderType = {
  System: 'System', // 系统默认 (全部、回收站)
  User: 'User'      // 用户自定义
} as const;

export type FolderType = (typeof FolderType)[keyof typeof FolderType];
