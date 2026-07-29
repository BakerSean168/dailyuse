import { createIdType } from '@memoflow/utils/domain';

import type { FocusModeId as IFocusModeId } from '@memoflow/contracts/primitives';

/**
 * FocusModeId 值对象
 * 用于强类型化专注模式 ID
 */
export const FocusModeId = createIdType<IFocusModeId>('IFocusModeId');
export type FocusModeId = IFocusModeId;
