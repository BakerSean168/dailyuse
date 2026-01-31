/**
 * EditorTab Entity - Server Interface
 * 编辑器标签实体 - 服务端接口
 */

import type { TabType } from '../enums';
import type { EditorTabClientDTO } from './EditorTabClient';

// 从值对象导入类型
import type { TabViewStateServerDTO } from '../value-objects';

/**
 * Editor Tab Server DTO
 * 编辑器标签服务端 DTO
 */
export interface EditorTabServerDTO {
  uuid: string;
  groupUuid: string; // 所属分组 UUID
  sessionUuid: string; // 所属会话 UUID
  workspaceUuid: string; // 所属工作区 UUID（聚合根外键）
  accountUuid: string;
  documentUuid?: string | null; // 关联文档 UUID（如果是文档标签）
  tabIndex: number; // 标签索引（在分组中的位置）
  tabType: TabType;
  name: string;
  viewState: TabViewStateServerDTO;
  isPinned: boolean;
  isDirty: boolean; // 是否有未保存的更改
  lastAccessedAt?: number | null; // epoch ms
  createdAt: number;
  updatedAt: number;
}

/**
 * Editor Tab Persistence DTO
 * 编辑器标签持久化 DTO（数据库字段，snake_case）
 */
export interface EditorTabPersistenceDTO {
  uuid: string;
  groupUuid: string;
  session_uuid: string;
  workspace_uuid: string;
  accountUuid: string;
  document_uuid?: string | null;
  tab_index: number;
  tab_type: TabType;
  name: string;
  view_state: string; // JSON 字符串
  is_pinned: boolean;
  is_dirty: boolean;
  lastAccessedAt?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Editor Tab Entity - Server Interface
 * 编辑器标签实体 - 服务端接口
 */
export interface EditorTabServer {
  // ===== 基础属性 =====
  readonly uuid: string;
  readonly groupUuid: string;
  readonly sessionUuid: string;
  readonly workspaceUuid: string;
  readonly accountUuid: string;
  readonly documentUuid?: string | null;
  readonly tabIndex: number;
  readonly tabType: TabType;
  readonly name: string;
  readonly viewState: TabViewStateServerDTO;
  readonly isPinned: boolean;
  readonly isDirty: boolean;
  readonly lastAccessedAt?: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // ===== 业务方法 =====

  /**
   * 更新标题
   */
  updateName(name: string): void;

  /**
   * 更新视图状态
   */
  updateViewState(viewState: Partial<TabViewStateServerDTO>): void;

  /**
   * 切换固定状态
   */
  togglePin(): void;

  /**
   * 标记为脏（有未保存更改）
   */
  markDirty(): void;

  /**
   * 标记为干净（已保存）
   */
  markClean(): void;

  /**
   * 记录访问时间
   */
  recordAccess(): void;

  /**
   * 更新标签索引（用于重新排序）
   */
  updateTabIndex(newIndex: number): void;

  /**
   * 判断是否为文档标签
   */
  isDocumentTab(): boolean;

  // ===== DTO 转换方法 =====}
