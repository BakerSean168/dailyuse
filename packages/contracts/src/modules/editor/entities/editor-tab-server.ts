/**
 * EditorTab Entity - Server Interface
 * 编辑器标签实�?- 服务端接�?
 */

import type { EditorTabId, EditorGroupId, EditorSessionId, EditorWorkspaceId, IdentityId, DocumentId, TransferDate, DomainDate, PersistenceDate } from '@/primitives';
import type { TabType } from '../value-objects/tab-type';
import type { EditorTabClientDTO } from './editor-tab-client';

// 从值对象导入类�?
import type { TabViewStateServerDTO } from '../value-objects';

/**
 * Editor Tab Server DTO
 * 编辑器标签服务端 DTO
 */
export interface EditorTabServerDTO {
  id: EditorTabId;
  groupId: EditorGroupId; // 所属分�?ID
  sessionId: EditorSessionId; // 所属会�?ID
  workspaceId: EditorWorkspaceId; // 所属工作区 ID（聚合根外键�?
  identityId: IdentityId;
  documentId: DocumentId | null; // 关联文档 ID（如果是文档标签�?
  tabIndex: number; // 标签索引（在分组中的位置�?
  tabType: TabType;
  name: string;
  viewState: TabViewStateServerDTO;
  isPinned: boolean;
  isDirty: boolean; // 是否有未保存的更�?
  lastAccessedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * Editor Tab Persistence DTO
 * 编辑器标签持久化 DTO（数据库字段，snake_case�?
 */
export interface EditorTabPersistenceDTO {
  id: EditorTabId;
  group_id: EditorGroupId;
  session_id: EditorSessionId;
  workspace_id: EditorWorkspaceId;
  identityId: IdentityId;
  document_id: DocumentId | null;
  tab_index: number;
  tab_type: TabType;
  name: string;
  view_state: string; // JSON 字符�?
  is_pinned: boolean;
  is_dirty: boolean;
  lastAccessedAt: PersistenceDate | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}
