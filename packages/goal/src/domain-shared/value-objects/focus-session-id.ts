import { createIdType } from '@dailyuse/utils/domain';

import type { FocusSessionId as IFocusSessionId } from '@dailyuse/contracts/primitives';

/**
 * FocusSessionId 值对象
 * 用于强类型化专注会话 ID
 */
export const FocusSessionId = createIdType<IFocusSessionId>('IFocusSessionId');
export type FocusSessionId = IFocusSessionId;
