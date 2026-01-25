/**
 * EditorGroup Entity - Client Interface
 * 编辑器分组实体 - 客户端接口
 */

import type { EditorGroupServerDTO } from './EditorGroupServer';

// 从实体导入类型
import type { EditorTabClientDTO } from './EditorTabClient';

/**
 * Editor Group Client DTO
 * 编辑器分组客户端 DTO（包含 UI 格式化字段）
 */
export interface EditorGroupClientDTO {
  uuid: string;
  sessionUuid: string;
  workspaceUuid: string;
  accountUuid: string;
  groupIndex: number;
  activeTabIndex: number;
  name?: string | null;

  // 子实体：标签列表
  tabs: EditorTabClientDTO[];

  createdAt: number;
  updatedAt: number;

  // UI 格式化字段
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * Editor Group Entity - Client Interface
 * 编辑器分组实体 - 客户端接口
 */
export interface EditorGroupClient {
  // ===== 基础属性 =====
  readonly uuid: string;
  readonly sessionUuid: string;
  readonly workspaceUuid: string;
  readonly accountUuid: string;
  readonly groupIndex: number;
  readonly activeTabIndex: number;
  readonly name?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // ===== UI 辅助方法 =====

  /**
   * 获取显示名称（如果没有名称，返回 "Group 1" 格式）
   */
  getDisplayName(): string;

  /**
   * 判断指定标签是否为活动标签
   */
  isActiveTab(tabIndex: number): boolean;

  /**
   * 是否有自定义名称
   */
  hasCustomName(): boolean;

  // ===== DTO 转换方法 =====

  toClientDTO(): EditorGroupClientDTO;
  toServerDTO(): EditorGroupServerDTO;
}
