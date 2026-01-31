/**
 * Editor Workspace Aggregate Root - Client Interface
 * 编辑器工作区聚合根 - 客户端接口
 */

import type { ProjectType } from '../enums';

// 从值对象导入类型
import type {
  WorkspaceLayoutClient,
  WorkspaceLayoutClientDTO,
  WorkspaceSettingsClient,
  WorkspaceSettingsClientDTO,
} from '../value-objects';
import type { EditorWorkspaceServerDTO } from './EditorWorkspaceServer';

// 从实体导入类型
import type { EditorSessionClientDTO } from '../entities/EditorSessionClient';

// ============ DTO 定义 ============

/**
 * Editor Workspace Client DTO
 */
export interface EditorWorkspaceClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;

  projectPath: string;
  projectType: ProjectType;

  layout: WorkspaceLayoutClientDTO;
  settings: WorkspaceSettingsClientDTO;

  // 子实体：会话列表
  sessions: EditorSessionClientDTO[];

  isActive: boolean;
  lastActiveSessionUuid?: string | null;

  // ✅ 时间戳统一使用 number (epoch ms)
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // UI 格式化属性
  formattedLastAccessed?: string | null; // "2 小时前"
  formattedCreatedAt: string; // "2024-10-10"
  formattedUpdatedAt: string; // "刚刚"
}

// ============ 聚合根接口 ============

/**
 * Editor Workspace Client Interface (聚合根)
 */
export interface EditorWorkspaceClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  projectPath: string;
  projectType: ProjectType;
  layout: WorkspaceLayoutClient;
  settings: WorkspaceSettingsClient;
  isActive: boolean;
  lastActiveSessionUuid?: string | null;
  lastAccessedAt?: number | null;
  createdAt: Date;
  updatedAt: Date;

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
   * 获取状态颜色
   */
  getStatusColor(): string;

  /**
   * 是否可以激活
   */
  canActivate(): boolean;

  /**
   * 格式化最后访问时间
   */
  getFormattedLastAccessed(): string | null;

  // ===== DTO 转换方法 =====
  /**
   * 转换为 Server DTO
   */
  /**
   * 从 Server DTO 创建实例（静态工厂方法）
   */
  // static fromServerDTO(dto: EditorWorkspaceServerDTO): EditorWorkspaceClient;

  /**
   * 从 Client DTO 创建实例（静态工厂方法）
   */
  // static fromClientDTO(dto: EditorWorkspaceClientDTO): EditorWorkspaceClient;
}
