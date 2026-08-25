import { ReminderStatus } from '@memoflow/contracts/reminder';
import type { ReminderGroup } from '../aggregates/reminder-group';
import type { ReminderTemplate } from '../aggregates/reminder-template';
import { evaluateRoutineEffectiveEnabled } from './effective-enabled';
import { ProfileMembership, RoutineDefinition, RoutineProfile } from './model';

/** Short-lived migration seam from legacy Reminder vocabulary to Routine truth. */
export function adaptLegacyReminderTemplate(input: {
  template: ReminderTemplate;
  group?: ReminderGroup | null;
  globalReminderEnabled?: boolean;
}): {
  routine: RoutineDefinition;
  profile: RoutineProfile | null;
  membership: ProfileMembership | null;
} {
  const { template, group = null, globalReminderEnabled = true } = input;
  const identityId = String(template.identityId);
  const routine = RoutineDefinition.load({
    id: String(template.id),
    identityId,
    name: template.title,
    description: template.description,
    // The legacy identity-wide switch is folded into this compatibility gate.
    enabled:
      globalReminderEnabled &&
      template.selfEnabled &&
      template.status === ReminderStatus.Active,
    version: template.version,
    createdAt: new Date(Number(template.createdAt)),
    updatedAt: new Date(Number(template.updatedAt)),
  });

  if (!group) {
    return { routine, profile: null, membership: null };
  }
  if (String(group.identityId) !== identityId) {
    throw new TypeError('Legacy reminder group ownership mismatch');
  }

  const profile = RoutineProfile.load({
    id: group.id,
    identityId,
    name: group.name,
    description: group.description,
    enabled: group.enabled,
    active: group.status === ReminderStatus.Active,
    version: group.version,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  });
  const membership = ProfileMembership.create({
    identityId,
    profileId: profile.id,
    routineId: routine.id,
    // Legacy had no per-membership state. The single-group edge starts enabled;
    // template state remains on RoutineDefinition and cannot be revived by profile state.
    enabled: true,
    now: group.updatedAt,
  });
  return { routine, profile, membership };
}

export function evaluateLegacyReminderEffectiveEnabled(input: {
  template: ReminderTemplate;
  group?: ReminderGroup | null;
  globalReminderEnabled?: boolean;
}): ReturnType<typeof evaluateRoutineEffectiveEnabled> {
  const adapted = adaptLegacyReminderTemplate(input);
  return evaluateRoutineEffectiveEnabled({
    routineEnabled: adapted.routine.enabled,
    profileEnabled: adapted.profile?.enabled,
    profileActive: adapted.profile?.active,
    membershipEnabled: adapted.membership?.enabled,
    temporaryOverrideAllowsExecution: true,
  });
}
