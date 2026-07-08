import { describe, expect, it, vi } from 'vitest';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import { createPowerSyncDataPortabilityDependencies } from '../powersync-export-dependencies';

function createFakeDb() {
  const getAll = vi.fn(async (sql: string, parameters?: unknown[]) => {
    if (sql.includes('FROM goals')) {
      expect(parameters).toEqual(['identity-1']);
      return [
        {
          id: 'goal-1',
          identity_id: 'identity-1',
          name: 'Ship portability',
          tags: '["desktop"]',
          created_at: '2026-06-03T00:00:00.000Z',
        },
      ];
    }

    if (sql.includes('FROM key_results')) {
      expect(parameters).toEqual(['goal-1']);
      return [
        {
          id: 'kr-1',
          identity_id: 'identity-1',
          goal_id: 'goal-1',
          title: 'Round trip',
          value_type: 'numeric',
          current_value: 1,
        },
      ];
    }

    if (sql.includes('FROM goal_reviews')) {
      expect(parameters).toEqual(['goal-1']);
      return [
        {
          id: 'review-1',
          identity_id: 'identity-1',
          goal_id: 'goal-1',
          review_type: 'weekly',
          content: 'Good',
        },
      ];
    }

    return [];
  });

  const db: IElectronDatabase = {
    execute: vi.fn(async () => ({ rowsAffected: 1 })),
    getAll,
    get: vi.fn(async () => ({})),
    getOptional: vi.fn(async () => null),
    writeTransaction: vi.fn(),
  };

  return { db, getAll };
}

describe('createPowerSyncDataPortabilityDependencies', () => {
  it('loads goal child rows when includeChildren is requested', async () => {
    const { db, getAll } = createFakeDb();
    const deps = createPowerSyncDataPortabilityDependencies(db);

    const goals = await deps.goalRepository.findByIdentityId('identity-1', {
      includeChildren: true,
    });

    expect(getAll).toHaveBeenCalledTimes(3);
    expect(goals).toEqual([
      {
        id: 'goal-1',
        identityId: 'identity-1',
        name: 'Ship portability',
        tags: '["desktop"]',
        createdAt: '2026-06-03T00:00:00.000Z',
        keyResults: [
          {
            id: 'kr-1',
            identityId: 'identity-1',
            goalId: 'goal-1',
            title: 'Round trip',
            valueType: 'numeric',
            currentValue: 1,
          },
        ],
        goalReviews: [
          {
            id: 'review-1',
            identityId: 'identity-1',
            goalId: 'goal-1',
            reviewType: 'weekly',
            content: 'Good',
          },
        ],
      },
    ]);
  });
});
