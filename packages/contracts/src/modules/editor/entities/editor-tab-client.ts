/**
 * EditorTab Entity - Client Interface
 * 缂栬緫鍣ㄦ爣绛惧疄浣?- 瀹㈡埛绔帴�?
 */

import type { EditorTabId, EditorGroupId, EditorSessionId, EditorWorkspaceId, IdentityId, DocumentId, TransferDate, DomainDate } from '@/primitives';
import type { TabType } from '../value-objects/tab-type';
import type { EditorTabServerDTO } from './editor-tab-server';

// 从值对象导入类型
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
