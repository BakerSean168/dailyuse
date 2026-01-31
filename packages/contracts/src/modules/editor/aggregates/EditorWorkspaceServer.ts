/**
 * Editor Workspace Aggregate Root - Server Interface
 * 编辑器工作区聚合根 - 服务端接口
 */

import type { ProjectType } from '../enums';
import type { EditorWorkspaceClientDTO } from './EditorWorkspaceClient';

// 从值对象导入类型
import type { WorkspaceLayoutServerDTO, WorkspaceSettingsServerDTO } from '../value-objects';

// 从实体导入类型
import type { EditorSessionServerDTO } from '../entities/EditorSessionServer';

// ============ 类型别名（向后兼容，简化使用） ============

/**
 * 工作区布局类型别名
 * @deprecated 使用 WorkspaceLayoutServerDTO 代替
 */
export type WorkspaceLayout = WorkspaceLayoutServerDTO;

/**
 * 工作区设置类型别名
 * @deprecated 使用 WorkspaceSettingsServerDTO 代替
 */
export type WorkspaceSettings = WorkspaceSettingsServerDTO;

// ============ DTO 定义 ============

/**
 * Editor Workspace Server DTO
 */
export interface EditorWorkspaceServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;

  // 关联项目
  projectPath: string;
  projectType: ProjectType;

  // 工作区配置
  layout: WorkspaceLayoutServerDTO;
  settings: WorkspaceSettingsServerDTO;

  // 子实体：会话列表
  sessions: EditorSessionServerDTO[];

  // 状态
  isActive: boolean;
  lastActiveSessionUuid?: string | null;

  // ✅ 时间戳统一使用 number (epoch ms)
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Editor Workspace Persistence DTO (数据库映射)
 */
export interface EditorWorkspacePersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;

  project_path: string;
  project_type: ProjectType;

  layout: string; // JSON string
  settings: string; // JSON string

  is_active: boolean;
  last_active_session_uuid?: string | null;

  lastAccessedAt?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============ 领域事件 ============

/**
 * 工作区创建事件
 */
export interface EditorWorkspaceCreatedEvent {
  type: 'editor.workspace.created';
  aggregateId: string; // workspaceUuid
  timestamp: Date; // epoch ms
  payload: {
    workspace: EditorWorkspaceServerDTO;
    createDefaultSession: boolean;
  };
}

/**
 * 工作区更新事件
 */
export interface EditorWorkspaceUpdatedEvent {
  type: 'editor.workspace.updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    workspace: EditorWorkspaceServerDTO;
    previousData: Partial<EditorWorkspaceServerDTO>;
    changes: string[];
  };
}

/**
 * 工作区删除事件
 */
export interface EditorWorkspaceDeletedEvent {
  type: 'editor.workspace.deleted';
  aggregateId: string;
  timestamp: Date;
  payload: {
    workspaceUuid: string;
    accountUuid: string;
  };
}

/**
 * 工作区激活事件
 */
export interface EditorWorkspaceActivatedEvent {
  type: 'editor.workspace.activated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    workspaceUuid: string;
    accountUuid: string;
  };
}

// ============ 聚合根接口 ============

/**
 * Editor Workspace Server Interface (聚合根)
 */
export interface EditorWorkspaceServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  projectPath: string;
  projectType: ProjectType;
  layout: WorkspaceLayoutServerDTO;
  settings: WorkspaceSettingsServerDTO;
  isActive: boolean;
  lastActiveSessionUuid?: string | null;
  lastAccessedAt?: number | null;
  createdAt: Date;
  updatedAt: Date;

  // ===== 领域方法 =====

  /**
   * 更新工作区信息
   */
  update(updates: {
    name?: string;
    description?: string;
    layout?: Partial<WorkspaceLayoutServerDTO>;
    settings?: Partial<WorkspaceSettingsServerDTO>;
  }): void;

  /**
   * 激活工作区
   */
  activate(): void;

  /**
   * 停用工作区
   */
  deactivate(): void;

  /**
   * 更新布局
   */
  updateLayout(layout: Partial<WorkspaceLayoutServerDTO>): void;

  /**
   * 更新设置
   */
  updateSettings(settings: Partial<WorkspaceSettingsServerDTO>): void;

  /**
   * 设置最后活跃的会话
   */
  setLastActiveSession(sessionUuid: string | null): void;

  /**
   * 记录访问时间
   */
  recordAccess(): void;

  // ===== DTO 转换方法 =====
  /**
   * 转换为 Client DTO
   */
  /**
   * 从 Server DTO 创建实例（静态工厂方法）
   */
  // static fromServerDTO(dto: EditorWorkspaceServerDTO): EditorWorkspaceServer;

  /**
   * 从 Persistence DTO 创建实例（静态工厂方法）
   */
  // static fromPersistenceDTO(dto: EditorWorkspacePersistenceDTO): EditorWorkspaceServer;
}
