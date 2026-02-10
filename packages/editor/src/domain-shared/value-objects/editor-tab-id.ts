import { createIdType } from '@dailyuse/utils';

import type { EditorTabId as IEditorTabId } from '@dailyuse/contracts/primitives';

/**
 * EditorTabId 值对象
 * 用于强类型化编辑器标签 ID
 */
export const EditorTabId = createIdType<IEditorTabId>('IEditorTabId');
export type EditorTabId = IEditorTabId;
