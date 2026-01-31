/**
 * EditorGroup Entity - Server Interface
 * 编辑器分组实�?- 服务端接�?
 */

import type { EditorGroupId, EditorSessionId, EditorWorkspaceId, IdentityId, TransferDate, DomainDate, PersistenceDate } from '@/primitives';
import type { EditorGroupClientDTO } from './editor-group-client';

// 从实体导入类�?
import type { EditorTabServerDTO, EditorTabPersistenceDTO } from './editor-tab-server';

/**
 * Editor Group Server DTO
 * 编辑器分组服务端 DTO
 */
export interface EditorGroupServerDTO {
  id: EditorGroupId;
  sessionId: EditorSessionId; // 所属会�?ID
  workspaceId: EditorWorkspaceId; // 所属工作区 ID（聚合根外键�?
  identityId: IdentityId;
  groupIndex: number; // 分组索引（在会话中的位置�?
  activeTabIndex: number; // 当前活动标签索引
  name: string | null; // 分组名称（可选）

  // 子实体：标签列表
  tabs: EditorTabServerDTO[];

  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * Editor Group Persistence DTO
 * 编辑器分组持久化 DTO（数据库字段，snake_case�?
 */
export interface EditorGroupPersistenceDTO {
  id: EditorGroupId;
  session_id: EditorSessionId;
  workspace_id: EditorWorkspaceId;
  identityId: IdentityId;
  group_index: number;
  active_tab_index: number;
  name: string | null;

  // 子实体：标签列表 (JSON 存储)
  tabs?: EditorTabPersistenceDTO[]; // �?使用 PersistenceDTO 类型

  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

/**
 * Editor Group Entity - Server Interface
 * 编辑器分组实�?- 服务端接�?
 */
export interface EditorGroupServer {
  // ===== 基础属�?=====
  readonly id: EditorGroupId;
  readonly sessionId: EditorSessionId;
  readonly workspaceId: EditorWorkspaceId;
  readonly identityId: IdentityId;
  readonly groupIndex: number;
  readonly activeTabIndex: number;
  readonly name: string | null;
  readonly createdAt: DomainDate;
  readonly updatedAt: DomainDate;

  // ===== 业务方法 =====

  /**
   * 设置活动标签
   */

  /**
   * 重命名分�?
   */

  /**
   * 更新分组索引（用于重新排序）
   */

  /**
   * 验证标签索引是否有效（需要配合标签列表使用）
   */

}
