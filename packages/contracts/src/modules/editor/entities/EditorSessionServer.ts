/**
 * EditorSession Server DTO
 *
 * ⚠️ 注意：EditorSession 是实体，不是聚合根
 * 所属聚合根: EditorWorkspace
 */

import type { EditorGroupServerDTO, EditorGroupPersistenceDTO } from './EditorGroupServer';
import type {
  SessionLayoutServerDTO,
  SessionLayoutPersistenceDTO,
} from '../value-objects/SessionLayout';

export interface EditorSessionServerDTO {
  // ===== 基础属性 =====
  uuid: string;
  workspaceUuid: string; // ✅ 外键：所属聚合根
  accountUuid: string;
  name: string;
  description: string | null;

  // ===== 子实体集合 =====
  groups: EditorGroupServerDTO[]; // ✅ 直接包含子实体

  // ===== 状态 =====
  isActive: boolean;
  activeGroupIndex: number;

  // ===== 布局配置 =====
  layout: SessionLayoutServerDTO;

  // ===== 时间戳 =====
  lastAccessedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * EditorSession Persistence DTO
 */
export interface EditorSessionPersistenceDTO {
  uuid: string;
  workspace_uuid: string;
  accountUuid: string;
  name: string;
  description: string | null;

  // 子实体集合 (JSON 存储或单独表)
  groups?: EditorGroupPersistenceDTO[];

  is_active: boolean;
  active_group_index: number;

  // 布局配置 (JSON 存储)
  layout: SessionLayoutPersistenceDTO;

  lastAccessedAt: number | null;
  createdAt: Date;
  updatedAt: Date;
}
