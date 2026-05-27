import type { ReminderTemplate } from '../aggregates/reminder-template';
import type { ReminderGroup } from '../aggregates/reminder-group';
import { ControlMode, ReminderStatus } from '@dailyuse/contracts/reminder';
import { BusinessRuleViolationError } from '@dailyuse/utils/errors';

export class ReminderPolicy {
  public calculateEffectiveEnabled(
    template: ReminderTemplate,
    group: ReminderGroup | null,
  ): boolean {
    const templateEnabled = template.status === ReminderStatus.Active;

    if (!group) {
      return templateEnabled;
    }

    if (group.controlMode === ControlMode.Individual) {
      return templateEnabled;
    }

    return group.status === ReminderStatus.Active && templateEnabled;
  }

  public assertValidGroupAssignment(
    template: ReminderTemplate,
    group: ReminderGroup | null,
  ): void {
    if (!group) {
      return;
    }

    if (group.identityId !== template.identityId) {
      throw new BusinessRuleViolationError(
        'Reminder template and group must belong to the same identity.',
      );
    }
  }

  public assertTemplateDeletable(
    template: ReminderTemplate,
    hardDelete: boolean,
  ): void {
    if (!hardDelete && template.deletedAt) {
      throw new BusinessRuleViolationError(
        'Reminder template is already deleted.',
      );
    }
  }

  public assertCanTrigger(
    template: ReminderTemplate,
    group: ReminderGroup | null,
  ): void {
    const isEnabled = this.calculateEffectiveEnabled(template, group);
    if (!isEnabled) {
      throw new BusinessRuleViolationError('Reminder template is not enabled.');
    }
  }
}
