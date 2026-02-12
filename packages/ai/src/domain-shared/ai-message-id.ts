import { createIdType } from '@dailyuse/utils';

import type { AiMessageId as IAiMessageId } from '@dailyuse/contracts/primitives';

/**
 * AiMessageId 值对象
 * 用于强类型化 AI 消息 ID
 */
export const AiMessageId = createIdType<IAiMessageId>('IAiMessageId');
export type AiMessageId = IAiMessageId;
