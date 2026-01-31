/**
 * EditorTab Entity - Client Interface
 * 缂栬緫鍣ㄦ爣绛惧疄浣?- 瀹㈡埛绔帴鍙?
 */

import type { TabType } from '../enums';
import type { EditorTabServerDTO } from './EditorTabServer';

// 浠庡€煎璞″鍏ョ被鍨?
import type { TabViewStateClientDTO } from '../value-objects';

/**
 * Editor Tab Client DTO
 * 缂栬緫鍣ㄦ爣绛惧鎴风 DTO锛堝寘AndUI 鏍煎紡鍖栧瓧娈碉級
 */
export interface EditorTabClientDTO {
  uuid: string;
  groupUuid: string;
  sessionUuid: string;
  workspaceUuid: string;
  accountUuid: string;
  documentUuid?: string | null;
  tabIndex: number;
  tabType: TabType;
  name: string;
  viewState: TabViewStateClientDTO;
  isPinned: boolean;
  isDirty: boolean;
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // UI 鏍煎紡鍖栧瓧娈?
  formattedLastAccessed?: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * Editor Tab Entity - Client Interface
 * 缂栬緫鍣ㄦ爣绛惧疄浣?- 瀹㈡埛绔帴鍙?
 */
export interface EditorTabClient {
  // ===== 鍩虹灞炴€?=====
  readonly uuid: string;
  readonly groupUuid: string;
  readonly sessionUuid: string;
  readonly workspaceUuid: string;
  readonly accountUuid: string;
  readonly documentUuid?: string | null;
  readonly tabIndex: number;
  readonly tabType: TabType;
  readonly name: string;
  readonly viewState: TabViewStateClientDTO;
  readonly isPinned: boolean;
  readonly isDirty: boolean;
  readonly lastAccessedAt?: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // ===== UI 杈呭姪鏂规硶 =====

  /**
   * Get鏄剧ず鏍囬锛堝寘鍚剰鏍囪锛?
   */
  getDisplayName(): string;

  /**
   * Get鏍囩绫诲瀷鏍囩
   */
  getTabTypeLabel(): string;

  /**
   * Get鏍囩鍥炬爣鍚嶇О
   */
  getIconName(): string;

  /**
   * 鏄惁涓烘枃妗ｆ爣绛?
   */
  isDocumentTab(): boolean;

  /**
   * 鏄惁鍙互鍏抽棴锛堟煇浜涚壒娈婃爣绛惧彲鑳戒笉鍏佽鍏抽棴锛?
   */
  canClose(): boolean;

  /**
   * 鏄惁Need瑕佺‘璁ゅ叧闂紙鏈夋湭Save鏇存敼鏃讹級
   */
  needsCloseConfirmation(): boolean;

  /**
   * Get鏍煎紡鍖栫殑鏈€鍚庤闂椂闂?
   */
  getFormattedLastAccessed(): string | null;

  /**
   * Get鏍囩鐘舵€侀鑹诧紙鐢ㄤ簬 UI 寰界珷锛?
   */
  getStatusColor(): string;

  // ===== DTO 杞崲鏂规硶 =====}
