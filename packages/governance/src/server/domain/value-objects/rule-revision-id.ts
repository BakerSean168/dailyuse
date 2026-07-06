/**
 * RuleRevisionId Value Object
 * 规则修订记录ID值对象
 */

import type { RuleRevisionId as IRuleRevisionId } from '@dailyuse/contracts/governance';

import { createIdType } from '@dailyuse/utils/domain';

/**
 * RuleRevisionId 值对象
 * 用于强类型化规则修订记录 ID
 */
export const RuleRevisionId = createIdType<IRuleRevisionId>('RuleRevisionId');
export type RuleRevisionId = IRuleRevisionId;

