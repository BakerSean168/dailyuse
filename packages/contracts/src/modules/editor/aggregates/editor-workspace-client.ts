/**
 * Editor Workspace Aggregate Root - Client Interface
 * 编辑器工作区聚合�?- 客户端接�?
 */

import type { EditorWorkspaceId, EditorSessionId, IdentityId, TransferDate, DomainDate } from '../../../primitives';
import type { ProjectType } from '../value-objects/project-type';

// 从值对象导入类�?
import type {
  WorkspaceLayoutClientDTO,
  WorkspaceSettingsClientDTO,
} from '../value-objects';
import type { EditorWorkspaceServerDTO } from './editor-workspace-server';

// 从实体导入类型
import type { EditorSessionClientDTO } from '../entities/editor-session-client';

// ============ DTO 定义 ============

/**
 * Editor Workspace Client DTO
 */
export interface EditorWorkspaceClientDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;

  projectPath: string;
  projectType: ProjectType;

  layout: WorkspaceLayoutClientDTO;
  settings: WorkspaceSettingsClientDTO;

  // 子实体：会话列表
  sessions: EditorSessionClientDTO[];

  isActive: boolean;
  lastActiveSessionId: string | null;

  // �?时间戳统一使用 TransferDate
  lastAccessedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI 格式化属�?
  formattedLastAccessed: string | null; // "2 小时�?
  formattedCreatedAt: string; // "2024-10-10"
  formattedUpdatedAt: string; // "刚刚"
}
