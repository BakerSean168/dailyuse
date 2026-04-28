import { describe, it, expect } from 'vitest';
import { PrismaFocusModeMapper } from './prisma-focus-mode-mapper';

describe('PrismaFocusModeMapper', () => {
  it('maps prisma row to domain focus mode', () => {
    const row = {
      id: 'focus-1',
      identityId: 'identity-1',
      focusedGoalIds: ['goal-1', 'goal-2'],
      startTime: new Date(1_000),
      endTime: new Date(2_000),
      hiddenGoalsMode: 'Hide',
      isActive: true,
      actualEndTime: new Date(1_500),
      createdAt: new Date(900),
      updatedAt: new Date(1_600),
    } as any;

    const domain = PrismaFocusModeMapper.toDomain(row);
    const dto = domain.toDTO();

    expect(dto.id).toBe('focus-1');
    expect(dto.identityId).toBe('identity-1');
    expect(dto.focusedGoalIds).toEqual(['goal-1', 'goal-2']);
    expect(dto.startTime).toBe(1_000);
    expect(dto.endTime).toBe(2_000);
    expect(dto.actualEndTime).toBe(1_500);
    expect(dto.createdAt).toBe(900);
    expect(dto.updatedAt).toBe(1_600);
  });

  it('maps list and preserves null actualEndTime', () => {
    const rows = [
      {
        id: 'focus-1',
        identityId: 'identity-1',
        focusedGoalIds: [],
        startTime: new Date(1_000),
        endTime: new Date(2_000),
        hiddenGoalsMode: 'ShowOnlyFocused',
        isActive: true,
        actualEndTime: null,
        createdAt: new Date(900),
        updatedAt: new Date(1_000),
      },
      {
        id: 'focus-2',
        identityId: 'identity-1',
        focusedGoalIds: ['goal-1'],
        startTime: new Date(3_000),
        endTime: new Date(4_000),
        hiddenGoalsMode: 'Hide',
        isActive: false,
        actualEndTime: new Date(3_500),
        createdAt: new Date(2_900),
        updatedAt: new Date(3_600),
      },
    ] as any[];

    const domains = PrismaFocusModeMapper.toDomainList(rows);

    expect(domains).toHaveLength(2);
    expect(domains[0].toDTO().actualEndTime).toBeNull();
    expect(domains[1].toDTO().id).toBe('focus-2');
  });
});
