/**
 * EditorTab Entity - Client Interface
 * 缂栬緫鍣ㄦ爣绛惧疄浣?- 瀹㈡埛绔帴�?
 */

import type { EditorTabId, EditorGroupId, EditorSessionId, EditorWorkspaceId, IdentityId, DocumentId, TransferDate, DomainDate } from '@/primitives';
import type { TabType } from '../value-objects/tab-type';
import type { EditorTabServerDTO } from './editor-tab-server';

// 浠庡€煎璞″鍏ョ被鍨?
import type { TabViewStateClientDTO } from '../value-objects';

/**
 * Editor Tab Client DTO
 * 缂栬緫鍣ㄦ爣绛惧鎴风 DTO锛堝寘AndUI 鏍煎紡鍖栧瓧娈碉�?
 */
export interface EditorTabClientDTO {
  id: string;
  groupId: string;
  sessionId: string;
  workspaceId: string;
  identityId: string;
  documentId: string | null;
  tabIndex: number;
  tabType: TabType;
  name: string;
  viewState: TabViewStateClientDTO;
  isPinned: boolean;
  isDirty: boolean;
  lastAccessedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI 鏍煎紡鍖栧瓧�?
  formattedLastAccessed: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * Editor Tab Entity - Client Interface
 * 缂栬緫鍣ㄦ爣绛惧疄浣?- 瀹㈡埛绔帴�?
 */
export interface EditorTabClient {
  // ===== 基础属�?=====
  readonly id: EditorTabId;
  readonly groupId: EditorGroupId;
  readonly sessionId: EditorSessionId;
  readonly workspaceId: EditorWorkspaceId;
  readonly identityId: IdentityId;
  readonly documentId: DocumentId | null;
  readonly tabIndex: number;
  readonly tabType: TabType;
  readonly name: string;
  readonly viewState: TabViewStateClientDTO;
  readonly isPinned: boolean;
  readonly isDirty: boolean;
  readonly lastAccessedAt: DomainDate | null;
  readonly createdAt: DomainDate;
  readonly updatedAt: DomainDate;

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
   * 鏄惁鍙互鍏抽棴锛堟煇浜涚壒娈婃爣绛惧彲鑳戒笉鍏佽鍏抽棴�?
   */
  canClose(): boolean;

  /**
   * 鏄惁Need瑕佺‘璁ゅ叧闂紙鏈夋湭Save鏇存敼鏃讹級
   */
  needsCloseConfirmation(): boolean;

  /**
   * Get鏍煎紡鍖栫殑鏈€鍚庤闂椂�?
   */
  getFormattedLastAccessed(): string | null;

  /**
   * Get鏍囩鐘舵€侀鑹诧紙鐢ㄤ�?UI 寰界珷锛?
   */
  getStatusColor(): string;

  // ===== DTO 杞崲鏂规硶 =====
}
