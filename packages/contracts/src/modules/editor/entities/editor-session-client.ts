/**
 * EditorSession Client DTO
 *
 * ⚠️ 注意：EditorSession 是实体，不是聚合根
 * 所属聚合根: EditorWorkspace
 */

import type { EditorSessionId, EditorWorkspaceId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type { EditorGroupClient, EditorGroupClientDTO } from './editor-group-client';
import type { SessionLayoutClient, SessionLayoutClientDTO } from '../value-objects/session-layout';

export interface EditorSessionClientDTO {
  // ===== 基础属性 =====
  id: string;
  workspaceId: string;
  identityId: string;
  name: string;
  description: string | null;

  // ===== 子实体集合 =====
  groups: EditorGroupClientDTO[]; // ✅ 直接包含子实体

  // ===== 状态 =====
  isActive: boolean;
  activeGroupIndex: number;

  // ===== 布局配置 =====
  layout: SessionLayoutClientDTO;

  // ===== UI 辅助字段 =====
  groupCount: number;

  // ===== 时间戳 =====
  lastAccessedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * EditorSession Entity - Client Interface
 * 编辑器会话实体 - 客户端接口
 */
export interface EditorSessionClient {
  // ===== 基础属性 =====
  readonly id: EditorSessionId;
  readonly workspaceId: EditorWorkspaceId;
  readonly identityId: IdentityId;
  readonly name: string;
  readonly description: string | null;

  // ===== 子实体集合 =====
  readonly groups: EditorGroupClient[];

  // ===== 状态 =====
  readonly isActive: boolean;
  readonly activeGroupIndex: number;

  // ===== 布局配置 =====
  readonly layout: SessionLayoutClient;

  // ===== 时间戳 =====
  readonly lastAccessedAt: DomainDate | null;
  readonly createdAt: DomainDate;
  readonly updatedAt: DomainDate;

  // ===== UI 辅助方法 =====

  /**
   * 获取显示名称
   */

  /**
   * 获取活动分组
   */

  /**
   * 是否有多个分组
   */

  // ===== DTO 转换方法 =====
}
