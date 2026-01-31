/**
 * EditorSession Server DTO
 *
 * ⚠️ 注意：EditorSession 是实体，不是聚合根
 * 所属聚合根: EditorWorkspace
 */

import type { EditorSessionId, EditorWorkspaceId, IdentityId, TransferDate, PersistenceDate } from '@/primitives';
import type { EditorGroupServerDTO, EditorGroupPersistenceDTO } from './editor-group-server';
import type {
  SessionLayoutServerDTO,
  SessionLayoutPersistenceDTO,
} from '../value-objects/session-layout';

export interface EditorSessionServerDTO {
  // ===== 基础属性 =====
  id: EditorSessionId;
  workspaceId: EditorWorkspaceId; // ✅ 外键：所属聚合根
  identityId: IdentityId;
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
  lastAccessedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * EditorSession Persistence DTO
 */
export interface EditorSessionPersistenceDTO {
  id: EditorSessionId;
  workspace_id: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;

  // 子实体集合 (JSON 存储或单独表)
  groups?: EditorGroupPersistenceDTO[];

  is_active: boolean;
  active_group_index: number;

  // 布局配置 (JSON 存储)
  layout: SessionLayoutPersistenceDTO;

  lastAccessedAt: PersistenceDate | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}
