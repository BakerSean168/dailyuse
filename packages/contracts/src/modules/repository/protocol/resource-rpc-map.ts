import type { ResourceBookmarkClientDTO } from '../entities';
import type { ResourceClientDTO } from '../aggregates';

export type ResourceRpcMap = {
  // === 基础操作 ===
  'resource.create-folder': [
    { repositoryId: string; name: string; parentFolderId: string | null }, 
    ResourceClientDTO
  ];
  
  'resource.upload-file': [
    { repositoryId: string; name: string; parentFolderId: string | null; blob: any }, 
    ResourceClientDTO
  ];

  'resource.rename': [
    { resourceId: string; newName: string }, 
    void
  ];

  'resource.move': [
    { resourceId: string; targetFolderId: string | null }, 
    void
  ];

  'resource.delete': [
    { resourceId: string; recursive: boolean }, 
    void
  ];

  // === 查询操作 ===
  'resource.get-children': [
    { repositoryId: string; parentFolderId: string | null }, 
    ResourceClientDTO[]
  ];

  'resource.get-tree': [
    { repositoryId: string; depth?: number }, 
    any // 返回树状结构数据
  ];

  // === 书签操作 ===
  /**
   * 添加书签 - 为指定资源创建一个书签
   */
  'resource.bookmark-add': [
    { resourceId: string; aliasName?: string; icon?: string; color?: string },
    ResourceBookmarkClientDTO
  ];

  /**
   * 移除书签 - 删除指定的书签
   */
  'resource.bookmark-remove': [
    { bookmarkId: string },
    void
  ];

  /**
   * 更新书签 - 修改书签的别名、图标或颜色
   */
  'resource.bookmark-update': [
    { bookmarkId: string; aliasName?: string; icon?: string; color?: string },
    void
  ];

  /**
   * 重新排序书签 - 批量更新书签的排序位置
   */
  'resource.bookmark-reorder': [
    { bookmarkIds: string[] },
    void
  ];

  /**
   * 获取我的所有书签 - 获取当前用户的全部书签列表
   */
  'resource.get-my-bookmarks': [
    void,
    ResourceBookmarkClientDTO[]
  ];
};