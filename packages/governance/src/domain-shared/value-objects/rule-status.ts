import type { RuleStatus as IRuleStatus } from '../../contracts/value-objects/rule-status';
import { RuleSeverity } from './rule-severity';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export type RuleStatus = IRuleStatus & { readonly __brand: unique symbol };

const VALUES: IRuleStatus[] = ['Draft', 'Active', 'Deprecated'];

export const RuleStatus = {
  Draft: 'Draft' as RuleStatus,
  Active: 'Active' as RuleStatus,
  Deprecated: 'Deprecated' as RuleStatus,
  Archived: 'Archived' as RuleStatus,

  create(value: string): Result<RuleStatus> {
    if (!this.isValid(value)) {
      return error(
        'VALIDATION_ERROR',
        `Invalid RuleStatus: "${value}". Valid values: ${VALUES.join(', ')}`
      );
    }
    return ok(value as RuleStatus);
  },

  isValid(value: string): value is RuleStatus {
    return VALUES.includes(value as IRuleStatus);
  },

  getAll(): RuleStatus[] {
    return VALUES as RuleStatus[];
  },

  isDraft(status: RuleStatus): boolean {
    return status === this.Draft;
  },

  isActive(status: RuleStatus): boolean {
    return status === this.Active;
  },

  isDeprecated(status: RuleStatus): boolean {
    return status === this.Deprecated;
  },

  isArchived(status: RuleStatus): boolean {
    return status === this.Archived;
  },

  isTerminal(status: RuleStatus): boolean {
    return this.isArchived(status);
  },

  canTransitionTo(
    from: RuleStatus,
    to: RuleStatus,
    context?: { severity?: RuleSeverity }
  ): Result<true> {
    if (from === to) return ok(true);

    const validTransitions: Record<IRuleStatus, Set<IRuleStatus>> = {
      'Draft': new Set(['Active']),
      'Active': new Set(['Deprecated']),
      'Deprecated': new Set(['Active']),
    };

    const allowedTargets = validTransitions[from as IRuleStatus];
    if (!allowedTargets?.has(to as IRuleStatus)) {
      const validList = Array.from(allowedTargets || []).join(', ') || 'none';
      return error(
        'BUSINESS_ERROR',
        `Cannot transition from ${from} to ${to}. Valid: ${validList}`
      );
    }

    if (from === this.Active && to === this.Deprecated) {
      if (context?.severity === RuleSeverity.Mandatory) {
        return error(
          'BUSINESS_ERROR',
          'Cannot deprecate MANDATORY rule. Downgrade to RECOMMENDED first.'
        );
      }
    }

    return ok(true);
  },
};
