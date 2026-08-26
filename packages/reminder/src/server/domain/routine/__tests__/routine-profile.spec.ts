import { describe, expect, it } from 'vitest';
import {
  evaluateRoutineMembershipEffectiveEnabled,
  ProfileMembership,
  RoutineDefinition,
  RoutineProfile,
} from '..';

describe('RoutineDefinition + RoutineProfile + ProfileMembership', () => {
  it('keeps independent membership state for the same routine in Work and Gaming profiles', () => {
    const routine = RoutineDefinition.create({
      id: 'drink-water',
      identityId: 'identity-1',
      name: 'Drink Water',
      enabled: true,
    });
    const work = RoutineProfile.create({
      id: 'work',
      identityId: 'identity-1',
      name: 'Work',
      enabled: true,
      active: true,
    });
    const gaming = RoutineProfile.create({
      id: 'gaming',
      identityId: 'identity-1',
      name: 'Gaming',
      enabled: true,
      active: true,
    });
    const workMembership = ProfileMembership.create({
      identityId: 'identity-1',
      routineId: routine.id,
      profileId: work.id,
      enabled: true,
    });
    const gamingMembership = ProfileMembership.create({
      identityId: 'identity-1',
      routineId: routine.id,
      profileId: gaming.id,
      enabled: false,
    });

    expect(evaluateRoutineMembershipEffectiveEnabled({
      routine,
      profile: work,
      membership: workMembership,
    }).effectiveEnabled).toBe(true);
    expect(evaluateRoutineMembershipEffectiveEnabled({
      routine,
      profile: gaming,
      membership: gamingMembership,
    }).effectiveEnabled).toBe(false);
  });

  it('profile off preserves membership enabled state and profile on does not revive disabled membership', () => {
    const routine = RoutineDefinition.create({
      id: 'stand-up',
      identityId: 'identity-1',
      name: 'Stand Up',
    });
    const profile = RoutineProfile.create({
      id: 'work',
      identityId: 'identity-1',
      name: 'Work',
      enabled: true,
      active: true,
    });
    const membership = ProfileMembership.create({
      identityId: 'identity-1',
      routineId: routine.id,
      profileId: profile.id,
      enabled: false,
    });

    profile.disable();
    expect(membership.enabled).toBe(false);
    expect(evaluateRoutineMembershipEffectiveEnabled({ routine, profile, membership }).blockedBy)
      .toEqual(expect.arrayContaining(['profileEnabled', 'membership']));

    profile.enable();
    expect(membership.enabled).toBe(false);
    expect(evaluateRoutineMembershipEffectiveEnabled({ routine, profile, membership }).effectiveEnabled)
      .toBe(false);
  });

  it('uses a strict AND across routine, profile enabled/active, membership and temporary override', () => {
    const routine = RoutineDefinition.create({
      identityId: 'identity-1',
      name: '20-20-20',
    });
    const profile = RoutineProfile.create({
      identityId: 'identity-1',
      name: 'Work',
      enabled: true,
      active: true,
    });
    const membership = ProfileMembership.create({
      identityId: 'identity-1',
      routineId: routine.id,
      profileId: profile.id,
    });

    expect(evaluateRoutineMembershipEffectiveEnabled({
      routine,
      profile,
      membership,
      temporaryOverrideAllowsExecution: false,
    })).toMatchObject({
      effectiveEnabled: false,
      blockedBy: ['temporaryOverride'],
    });
  });

  it('rejects cross-identity or mismatched membership evaluation', () => {
    const routine = RoutineDefinition.create({ identityId: 'a', name: 'Hydration' });
    const profile = RoutineProfile.create({ identityId: 'b', name: 'Work', active: true });
    const membership = ProfileMembership.create({
      identityId: 'a',
      routineId: routine.id,
      profileId: profile.id,
    });

    expect(() => evaluateRoutineMembershipEffectiveEnabled({ routine, profile, membership }))
      .toThrow('ownership mismatch');
  });
});
