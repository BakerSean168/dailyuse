import { describe, it, expect } from 'vitest';
import { aPrefixedUuid } from '@memoflow/test-utils/fixtures';
import { PrismaFocusSessionMapper } from './prisma-focus-session-mapper';

describe('PrismaFocusSessionMapper', () => {
  const SESSION_ID_1 = aPrefixedUuid('IFocusSessionId', 'focus-session-1');
  const IDENTITY_ID_1 = aPrefixedUuid('IdentityId', 'focus-session-owner-1');
  const GOAL_ID_1 = aPrefixedUuid('IGoalId', 'focus-session-goal-1');

  it('maps prisma row to domain focus session', () => {
    const row = {
      id: SESSION_ID_1,
      identityId: IDENTITY_ID_1,
      goalId: GOAL_ID_1,
      status: 'Active',
      durationMinutes: 30,
      actualDurationMinutes: 10,
      description: 'focus',
      startedAt: new Date(1_000),
      pausedAt: new Date(1_500),
      resumedAt: new Date(1_700),
      completedAt: null,
      cancelledAt: null,
      pauseCount: 1,
      pausedDurationMinutes: 5,
      version: undefined,
      createdAt: new Date(900),
      updatedAt: new Date(1_800),
      deletedAt: null,
    } as any;

    const domain = PrismaFocusSessionMapper.toDomain(row);
    const dto = domain.toServerDTO();

    expect(dto.id).toBe(SESSION_ID_1);
    expect(dto.goalId).toBe(GOAL_ID_1);
    expect(dto.status).toBe('Active');
    expect(dto.durationMinutes).toBe(30);
    expect(dto.pauseCount).toBe(1);
    expect(dto.version).toBe(1);
    expect(dto.startedAt).toBe(1_000);
  });

  it('maps list and handles nullable goalId and deletedAt', () => {
    const rows = [
      {
        id: SESSION_ID_1,
        identityId: IDENTITY_ID_1,
        goalId: null,
        status: 'Completed',
        durationMinutes: 25,
        actualDurationMinutes: 25,
        description: null,
        startedAt: new Date(1_000),
        pausedAt: null,
        resumedAt: null,
        completedAt: new Date(2_500),
        cancelledAt: null,
        pauseCount: 0,
        pausedDurationMinutes: 0,
        version: 2,
        createdAt: new Date(900),
        updatedAt: new Date(2_500),
        deletedAt: new Date(3_000),
      },
    ] as any[];

    const domains = PrismaFocusSessionMapper.toDomainList(rows);
    const dto = domains[0].toServerDTO();

    expect(domains).toHaveLength(1);
    expect(dto.goalId).toBeNull();
    expect(dto.version).toBe(2);
    expect(dto.deletedAt).toBe(3_000);
  });
});
