/**
 * EditorGroup Entity - Client Interface
 * 编辑器分组实�?- 客户端接�?
 */

import type { EditorGroupId, EditorSessionId, EditorWorkspaceId, IdentityId, TransferDate, DomainDate } from '../../../primitives';
import type { EditorGroupServerDTO } from './editor-group-server';

// 从实体导入类型
import type { EditorTabClientDTO } from './editor-tab-client';

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
