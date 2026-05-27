import { createIdType } from '@dailyuse/utils/domain';

import type { EditorGroupId as IEditorGroupId } from '@dailyuse/contracts/primitives';

/**
 * EditorGroupId 值对象
 * 用于强类型化编辑器分组 ID
 */
export const EditorGroupId = createIdType<IEditorGroupId>('IEditorGroupId');
export type EditorGroupId = IEditorGroupId;
