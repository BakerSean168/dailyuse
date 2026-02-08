import type { RuleSeverity as IRuleSeverity } from '../../contracts/value-objects/rule-severity';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export type RuleSeverity = IRuleSeverity & { readonly __brand: unique symbol };

const VALUES: IRuleSeverity[] = ['Mandatory', 'Recommended'];

export const RuleSeverity = {
  Mandatory: 'Mandatory' as RuleSeverity,
  Recommended: 'Recommended' as RuleSeverity,

  create(value: string): Result<RuleSeverity> {
    if (!this.isValid(value)) {
      return error(
        'VALIDATION_ERROR',
        `Invalid RuleSeverity: "${value}". Valid values: ${VALUES.join(', ')}`
      );
    }
    return ok(value as RuleSeverity);
  },

  isValid(value: string): value is RuleSeverity {
    return VALUES.includes(value as IRuleSeverity);
  },

  getAll(): RuleSeverity[] {
    return VALUES as RuleSeverity[];
  },

  isMandatory(severity: RuleSeverity): boolean {
    return severity === this.Mandatory;
  },

  isRecommended(severity: RuleSeverity): boolean {
    return severity === this.Recommended;
  },

  isStricterThan(a: RuleSeverity, b: RuleSeverity): boolean {
    const levels = { Mandatory: 2, Recommended: 1 };
    return levels[a as IRuleSeverity] > levels[b as IRuleSeverity];
  },
};
