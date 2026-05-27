import { createIdType } from '@dailyuse/utils/domain';

import type { FocusModeId as IFocusModeId } from '@dailyuse/contracts/primitives';

/**
 * FocusModeId 值对象
 * 用于强类型化专注模式 ID
 */
export const FocusModeId = createIdType<IFocusModeId>('IFocusModeId');
export type FocusModeId = IFocusModeId;
