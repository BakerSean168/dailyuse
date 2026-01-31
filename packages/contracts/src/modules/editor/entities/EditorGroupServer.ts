/**
 * EditorGroup Entity - Server Interface
 * 编辑器分组实体 - 服务端接口
 */

import type { EditorGroupClientDTO } from './EditorGroupClient';

// 从实体导入类型
import type { EditorTabServerDTO, EditorTabPersistenceDTO } from './EditorTabServer';

/**
 * Editor Group Server DTO
 * 编辑器分组服务端 DTO
 */
export interface EditorGroupServerDTO {
  uuid: string;
  sessionUuid: string; // 所属会话 UUID
  workspaceUuid: string; // 所属工作区 UUID（聚合根外键）
  accountUuid: string;
  groupIndex: number; // 分组索引（在会话中的位置）
  activeTabIndex: number; // 当前活动标签索引
  name?: string | null; // 分组名称（可选）

  // 子实体：标签列表
  tabs: EditorTabServerDTO[];

  createdAt: number;
  updatedAt: number;
}

/**
 * Editor Group Persistence DTO
 * 编辑器分组持久化 DTO（数据库字段，snake_case）
 */
export interface EditorGroupPersistenceDTO {
  uuid: string;
  session_uuid: string;
  workspace_uuid: string;
  accountUuid: string;
  group_index: number;
  active_tab_index: number;
  name?: string | null;

  // 子实体：标签列表 (JSON 存储)
  tabs?: EditorTabPersistenceDTO[]; // ✅ 使用 PersistenceDTO 类型

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Editor Group Entity - Server Interface
 * 编辑器分组实体 - 服务端接口
 */
export interface EditorGroupServer {
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

  // ===== 业务方法 =====

  /**
   * 设置活动标签
   */
  setActiveTab(tabIndex: number): void;

  /**
   * 重命名分组
   */
  rename(name: string | null): void;

  /**
   * 更新分组索引（用于重新排序）
   */
  updateGroupIndex(newIndex: number): void;

  /**
   * 验证标签索引是否有效（需要配合标签列表使用）
   */
  isValidTabIndex(tabIndex: number, tabCount: number): boolean;

  // ===== DTO 转换方法 =====}
