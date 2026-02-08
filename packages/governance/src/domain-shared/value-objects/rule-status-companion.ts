/**
 * RuleStatus Companion - State machine logic for Rule lifecycle
 * 
 * Enforces valid status transitions:
 * - Draft → Active (publish)
 * - Active → Deprecated (deprecate, requires severity=RECOMMENDED)
 * - Deprecated → Active (reactivate)
 * 
 * Blocked transitions:
 * - Draft → Deprecated (direct deprecation not allowed)
 * - Active (MANDATORY) → Deprecated (must downgrade severity first)
 */

import { RuleStatus as RuleStatusEnum } from '../../contracts/value-objects/rule-status';
import { RuleSeverity } from '../../contracts/value-objects/rule-severity';
import type { Result, ok, fail } from '@dailyuse/contracts/result';

export class RuleStatusCompanion {
  /**
   * Validates if transition from one status to another is allowed
   * 
   * @param from - Current status
   * @param to - Target status
   * @param severity - Current severity (affects MANDATORY deprecation block)
   * @returns true if transition is valid
   */
  static canTransitionTo(
    from: RuleStatusEnum,
    to: RuleStatusEnum,
    severity: RuleSeverity
  ): boolean {
    // Same status - no transition needed
    if (from === to) {
      return true;
    }
    
    // Draft → Deprecated: blocked (must publish first)
    if (from === RuleStatusEnum.Draft && to === RuleStatusEnum.Deprecated) {
      return false;
    }
    
    // Active (MANDATORY) → Deprecated: blocked (must downgrade severity first)
    if (
      from === RuleStatusEnum.Active && 
      to === RuleStatusEnum.Deprecated && 
      severity === RuleSeverity.Mandatory
    ) {
      return false;
    }
    
    // All other transitions allowed
    // Draft → Active (publish)
    // Active → Deprecated (deprecate, if RECOMMENDED)
    // Deprecated → Active (reactivate)
    return true;
  }
  
  /**
   * Parses string value to RuleStatus enum
   */
  static of(value: string): Result<RuleStatusEnum> {
    if (!Object.values(RuleStatusEnum).includes(value as any)) {
      return fail(`Invalid status: ${value}`);
    }
    return ok(value as RuleStatusEnum);
  }
  
  /**
   * Checks if value is valid RuleStatus
   */
  static isValid(value: string): boolean {
    return Object.values(RuleStatusEnum).includes(value as any);
  }
}
