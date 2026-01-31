/**
 * Editor Workspace Aggregate Root - Client Interface
 * 编辑器工作区聚合�?- 客户端接�?
 */

import type { EditorWorkspaceId, EditorSessionId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type { ProjectType } from '../value-objects/project-type';

// 从值对象导入类�?
import type {
  WorkspaceLayoutClient,
  WorkspaceLayoutClientDTO,
  WorkspaceSettingsClient,
  WorkspaceSettingsClientDTO,
} from '../value-objects';
import type { EditorWorkspaceServerDTO } from './editor-workspace-server';

// 从实体导入类�?
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

// ============ 聚合根接�?============

/**
 * Editor Workspace Client Interface (聚合�?
 */
export interface EditorWorkspaceClient {
  // ===== 基础属�?=====
  id: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  projectPath: string;
  projectType: ProjectType;
  layout: WorkspaceLayoutClient;
  settings: WorkspaceSettingsClient;
  isActive: boolean;
  lastActiveSessionId: EditorSessionId | null;
  lastAccessedAt: DomainDate | null;
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // ===== UI 辅助方法 =====

  /**
   * 获取显示名称
   */
  getDisplayName(): string;

  /**
   * 获取项目类型标签
   */
  getProjectTypeLabel(): string;

  /**
   * 获取状态颜�?
   */
  getStatusColor(): string;

  /**
   * 是否可以激�?
   */
  canActivate(): boolean;

  /**
   * 格式化最后访问时�?
   */
  getFormattedLastAccessed(): string | null;

  // ===== DTO 转换方法 =====

  /**
   * 转换�?Client DTO
   */

  /**
   * 转换�?Server DTO
   */

  /**
   * �?Server DTO 创建实例（静态工厂方法）
   */
  // static fromServerDTO(dto: EditorWorkspaceServerDTO): EditorWorkspaceClient;

  /**
   * �?Client DTO 创建实例（静态工厂方法）
   */
  // static fromClientDTO(dto: EditorWorkspaceClientDTO): EditorWorkspaceClient;
}
