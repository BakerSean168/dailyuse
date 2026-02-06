/**
 * EditorGroup Entity - Client Interface
 * 编辑器分组实�?- 客户端接�?
 */

import type { EditorGroupId, EditorSessionId, EditorWorkspaceId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type { EditorGroupServerDTO } from './editor-group-server';

// 从实体导入类型
import type { EditorTabClient, EditorTabClientDTO } from './editor-tab-client';

/**
 * Editor Group Client DTO
 * 编辑器分组客户端 DTO（包�?UI 格式化字段）
 */
export interface EditorGroupClientDTO {
  id: string;
  sessionId: string;
  workspaceId: string;
  identityId: string;
  groupIndex: number;
  activeTabIndex: number;
  name: string | null;

  // 子实体：标签列表
  tabs: EditorTabClientDTO[];

  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI 格式化字�?
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * Editor Group Entity - Client Interface
 * 编辑器分组实�?- 客户端接�?
 */
export interface EditorGroupClient {
  // ===== 基础属性 =====
  readonly id: EditorGroupId;
  readonly sessionId: EditorSessionId;
  readonly workspaceId: EditorWorkspaceId;
  readonly identityId: IdentityId;
  readonly groupIndex: number;
  readonly activeTabIndex: number;
  readonly name: string | null;

  // ===== 子实体集合 =====
  readonly tabs: EditorTabClient[];

  // ===== 时间戳 =====
  readonly createdAt: DomainDate;
  readonly updatedAt: DomainDate;

  // ===== UI 辅助方法 =====

  /**
   * 获取显示名称（如果没有名称，返回 "Group 1" 格式�?
   */

  /**
   * 判断指定标签是否为活动标�?
   */

  /**
   * 是否有自定义名称
   */

}
