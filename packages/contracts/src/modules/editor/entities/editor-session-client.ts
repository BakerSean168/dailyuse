/**
 * EditorSession Client DTO
 *
 * ⚠️ 注意：EditorSession 是实体，不是聚合根
 * 所属聚合根: EditorWorkspace
 */

import type { EditorSessionId, EditorWorkspaceId, IdentityId, TransferDate } from '@/primitives';
import type { EditorGroupClientDTO } from './editor-group-client';
import type { SessionLayoutClientDTO } from '../value-objects/session-layout';

export interface EditorSessionClientDTO {
  // ===== 基础属性 =====
  id: string;
  workspaceId: string;
  identityId: string;
  name: string;
  description: string | null;

  // ===== 子实体集合 =====
  groups: EditorGroupClientDTO[]; // ✅ 直接包含子实体

  // ===== 状态 =====
  isActive: boolean;
  activeGroupIndex: number;

  // ===== 布局配置 =====
  layout: SessionLayoutClientDTO;

  // ===== UI 辅助字段 =====
  groupCount: number;

  // ===== 时间戳 =====
  lastAccessedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}
