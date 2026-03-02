/**
 * Editor Workspace Aggregate Root - Server Interface
 * 编辑器工作区聚合�?- 服务端接�?
 */

import type { EditorWorkspaceId, EditorSessionId, IdentityId, TransferDate, DomainDate, PersistenceDate } from '../../../primitives';
import type { ProjectType } from '../value-objects/project-type';

import type { WorkspaceLayoutServerDTO, WorkspaceSettingsServerDTO } from '../value-objects';

import type { EditorSessionServerDTO } from '../entities/editor-session-server';

// ============ 类型别名（向后兼容，简化使用） ============

/**
 * 工作区布局类型别名
 * @deprecated 使用 WorkspaceLayoutServerDTO 代替
 */
export type WorkspaceLayout = WorkspaceLayoutServerDTO;

/**
 * 工作区设置类型别�?
 * @deprecated 使用 WorkspaceSettingsServerDTO 代替
 */
export type WorkspaceSettings = WorkspaceSettingsServerDTO;

// ============ DTO 定义 ============

/**
 * Editor Workspace Server DTO
 */
export interface EditorWorkspaceServerDTO {
  id: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;

  // 关联项目
  projectPath: string;
  projectType: ProjectType;

  // 工作区配�?
  layout: WorkspaceLayoutServerDTO;
  settings: WorkspaceSettingsServerDTO;

  // 子实体：会话列表
  sessions: EditorSessionServerDTO[];

  // 状�?
  isActive: boolean;
  lastActiveSessionId: EditorSessionId | null;

  // �?时间戳统一使用 TransferDate
  lastAccessedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * Editor Workspace Persistence DTO (数据库映�?
 */
export interface EditorWorkspacePersistenceDTO {
  id: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;

  project_path: string;
  project_type: ProjectType;

  layout: string; // JSON string
  settings: string; // JSON string

  is_active: boolean;
  last_active_session_id: EditorSessionId | null;

  lastAccessedAt: PersistenceDate | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

// ============ 领域事件 ============

/**
 * 工作区创建事�?
 */
export interface EditorWorkspaceCreatedEvent {
  type: 'editor.workspace.created';
  aggregateId: string; // workspaceId
  timestamp: DomainDate;
  payload: {
    workspace: EditorWorkspaceServerDTO;
    createDefaultSession: boolean;
  };
}

/**
 * 工作区更新事�?
 */
export interface EditorWorkspaceUpdatedEvent {
  type: 'editor.workspace.updated';
  aggregateId: string;
  timestamp: DomainDate;
  payload: {
    workspace: EditorWorkspaceServerDTO;
    previousData: Partial<EditorWorkspaceServerDTO>;
    changes: string[];
  };
}

/**
 * 工作区删除事�?
 */
export interface EditorWorkspaceDeletedEvent {
  type: 'editor.workspace.deleted';
  aggregateId: string;
  timestamp: DomainDate;
  payload: {
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
  };
}

/**
 * 工作区激活事�?
 */
export interface EditorWorkspaceActivatedEvent {
  type: 'editor.workspace.activated';
  aggregateId: string;
  timestamp: DomainDate;
  payload: {
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
  };
}
