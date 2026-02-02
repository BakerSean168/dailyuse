/**
 * Resource Bookmark Entity - Client Interface
 * 资源书签实体 - 客户端接口
 */
import type { TransferDate } from '@/primitives';

// ============ DTO 定义 ============

/**
 * Resource Bookmark Client DTO
 * 客户端展示用的数据传输对象
 */
export interface ResourceBookmarkClientDTO {
  id: string;
  resourceId: string;
  identityId: string;
  
  aliasName: string | null;
  icon: string | null;
  color: string | null;
  
  sortOrder: number;
  createdAt: TransferDate;

  // UI 计算字段
  displayName: string; // 显示名称（aliasName 或资源原名）
  isOwner: boolean; // 是否是当前用户的书签
}

// ============ 实体接口 ============

/**
 * Resource Bookmark 实体 - Client 接口（实例方法）
 */
export interface ResourceBookmarkClient {
  // 基础属性
  id: string;
  resourceId: string;
  identityId: string;
  
  aliasName: string | null;
  icon: string | null;
  color: string | null;
  
  sortOrder: number;
  createdAt: Date;

  // UI 计算属性
  displayName: string;
  isOwner: boolean;
}
