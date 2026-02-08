/**
 * RuleSeverity Companion - Validation and parsing for severity levels
 */

import { RuleSeverity as RuleSeverityEnum } from '../../contracts/value-objects/rule-severity';
import type { Result, ok, fail } from '@dailyuse/contracts/result';

export class RuleSeverityCompanion {
  /**
   * Parses string value to RuleSeverity enum
   */
  static of(value: string): Result<RuleSeverityEnum> {
    if (!Object.values(RuleSeverityEnum).includes(value as any)) {
      return fail(`Invalid severity: ${value}`);
    }
    return ok(value as RuleSeverityEnum);
  }
  
  /**
   * Checks if value is valid RuleSeverity
   */
  static isValid(value: string): boolean {
    return Object.values(RuleSeverityEnum).includes(value as any);
  }
}
