/**
 * EditorSession Server DTO
 *
 * ⚠️ 注意：EditorSession 是实体，不是聚合根
 * 所属聚合根: EditorWorkspace
 */

import type { EditorSessionId, EditorWorkspaceId, IdentityId, TransferDate } from '../../../primitives';
import type { EditorGroupServerDTO } from './editor-group-server';
import type {
  SessionLayoutDTO,
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
  layout: SessionLayoutDTO;

  // ===== 时间戳 =====
  lastAccessedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

