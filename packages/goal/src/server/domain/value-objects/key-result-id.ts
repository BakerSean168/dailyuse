import { createIdType } from '@memoflow/utils/domain';

import type { KeyResultId as IKeyResultId } from '@memoflow/contracts/primitives';

/**
 * KeyResultId 值对象
 * 用于强类型化关键结果 ID
 */
export const KeyResultId = createIdType<IKeyResultId>('IKeyResultId');
export type KeyResultId = IKeyResultId;
