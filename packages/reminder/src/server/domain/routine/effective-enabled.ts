import type { ProfileMembership, RoutineDefinition, RoutineProfile } from './model';

/**
 * The only canonical effective-enabled formula for Routine Coach.
 *
 * effectiveEnabled =
 *   routine.enabled
 *   && profile.enabled
 *   && profile.active
 *   && membership.enabled
 *   && temporaryOverrideAllowsExecution
 *
 * A routine without an explicit profile/membership uses neutral `true` gates.
 * Legacy identity-wide enablement is folded into the routine gate at the
 * adapter seam; it must not become a second effective-state algorithm.
 */
export interface RoutineEffectiveEnabledInput {
  routineEnabled: boolean;
  profileEnabled?: boolean;
  profileActive?: boolean;
  membershipEnabled?: boolean;
  temporaryOverrideAllowsExecution?: boolean;
}

export interface RoutineEffectiveEnabledResult {
  effectiveEnabled: boolean;
  gates: {
    routine: boolean;
    profileEnabled: boolean;
    profileActive: boolean;
    membership: boolean;
    temporaryOverride: boolean;
  };
  blockedBy: Array<keyof RoutineEffectiveEnabledResult['gates']>;
}

export function evaluateRoutineEffectiveEnabled(
  input: RoutineEffectiveEnabledInput,
): RoutineEffectiveEnabledResult {
  const gates = {
    routine: input.routineEnabled,
    profileEnabled: input.profileEnabled ?? true,
    profileActive: input.profileActive ?? true,
    membership: input.membershipEnabled ?? true,
    temporaryOverride: input.temporaryOverrideAllowsExecution ?? true,
  };
  const blockedBy = (Object.entries(gates) as Array<[keyof typeof gates, boolean]>)
    .filter(([, enabled]) => !enabled)
    .map(([gate]) => gate);
  return {
    effectiveEnabled: blockedBy.length === 0,
    gates,
    blockedBy,
  };
}

export function evaluateRoutineMembershipEffectiveEnabled(input: {
  routine: RoutineDefinition;
  profile: RoutineProfile;
  membership: ProfileMembership;
  temporaryOverrideAllowsExecution?: boolean;
}): RoutineEffectiveEnabledResult {
  if (
    input.routine.identityId !== input.profile.identityId ||
    input.routine.identityId !== input.membership.identityId ||
    input.routine.id !== input.membership.routineId ||
    input.profile.id !== input.membership.profileId
  ) {
    throw new TypeError('Routine/profile/membership ownership mismatch');
  }

  return evaluateRoutineEffectiveEnabled({
    routineEnabled: input.routine.enabled,
    profileEnabled: input.profile.enabled,
    profileActive: input.profile.active,
    membershipEnabled: input.membership.enabled,
    temporaryOverrideAllowsExecution: input.temporaryOverrideAllowsExecution,
  });
}
