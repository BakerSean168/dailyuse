/**
 * Resource Bookmark Entity - Server Interface
 * 资源书签实体 - 服务端接口
 * 
 * 作为 Repository 模块的子实体，用于实现用户对资源的书签标记功能
 * 
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
 */
import type { DomainDate, TransferDate, PersistenceDate } from '@/primitives';

// ============ 实体接口 ============

/**
 * Resource Bookmark 实体 - Server 接口（实例方法）
 */
export interface ResourceBookmarkServer {
  id: string;
  resourceId: string; // 指向的资源 ID
  identityId: string; // 所有者 (用户/身份)
  
  aliasName: string | null; // 用户自定义别名（null 时显示资源原名）
  icon: string | null; // 自定义图标
  color: string | null; // 自定义颜色
  
  sortOrder: number; // 在书签栏中的排序位置

  // 同步字段
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}

// ============ DTO 定义 ============

/**
 * Resource Bookmark Server DTO
 */
export interface ResourceBookmarkServerDTO {
  id: string;
  resourceId: string;
  identityId: string;
  
  aliasName: string | null;
  icon: string | null;
  color: string | null;
  
  sortOrder: number;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/**
 * Resource Bookmark Persistence DTO
 */
export interface ResourceBookmarkPersistenceDTO {
  id: string;
  resourceId: string;
  identityId: string;
  
  aliasName: string | null;
  icon: string | null;
  color: string | null;
  
  sortOrder: number;
  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}
