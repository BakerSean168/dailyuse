/**
 * RuleId - Branded type for Rule identifiers
 * 
 * Prevents ID type confusion at compile time
 * Uses createIdType utility per constitution
 */

import { createIdType } from '@dailyuse/utils/domain';

interface IRuleId {
  __brand: 'RuleId';
}

/**
 * RuleId companion object with generation and validation methods
 * 
 * Usage:
 * - RuleId.generate() - creates new UUID-based ID
 * - RuleId.of(value) - creates from existing string
 * - RuleId.tryParse(value) - safe parse returning Result
 */
export const RuleId = createIdType<IRuleId>('RuleId');
export type RuleId = ReturnType<typeof RuleId.of>;
