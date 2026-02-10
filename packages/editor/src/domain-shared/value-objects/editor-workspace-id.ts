import { createIdType } from '@dailyuse/utils';

import type { EditorWorkspaceId as IEditorWorkspaceId } from '@dailyuse/contracts/primitives';

/**
 * EditorWorkspaceId 值对象
 * 用于强类型化编辑器工作区 ID
 */
export const EditorWorkspaceId = createIdType<IEditorWorkspaceId>('IEditorWorkspaceId');
export type EditorWorkspaceId = IEditorWorkspaceId;
