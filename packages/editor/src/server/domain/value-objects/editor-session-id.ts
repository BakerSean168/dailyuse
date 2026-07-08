import { createIdType } from '@dailyuse/utils/domain';

import type { EditorSessionId as IEditorSessionId } from '@dailyuse/contracts/primitives';

/**
 * EditorSessionId 值对象
 * 用于强类型化编辑器会话 ID
 */
export const EditorSessionId = createIdType<IEditorSessionId>('IEditorSessionId');
export type EditorSessionId = IEditorSessionId;
