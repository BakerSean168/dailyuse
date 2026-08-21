import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { anIdentityId } from '@memoflow/test-utils';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IGoalRepository } from '../../../../domain/repositories/i-goal-repository';
import { Goal, GoalId, GoalPolicy, KeyResultId } from '../../../../domain';
import { CreateGoalUseCase } from '../create-goal.use-case';

describe('CreateGoalUseCase', () => {
  let goalRepo: ReturnType<typeof createMockRepo<IGoalRepository>>;
  let useCase: CreateGoalUseCase;
  const testIdentityId = anIdentityId();

  function aContext(overrides: Record<string, any> = {}) {
    return { identityId: testIdentityId, ...overrides };
  }

  function aCreateInput(overrides: Record<string, any> = {}) {
    return {
      name: 'Learn TypeScript',
      description: 'Master DDD patterns',
      color: '#3B82F6',
      importance: 'MEDIUM',
      tags: [],
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    goalRepo = createMockRepo<IGoalRepository>({
      save: vi.fn().mockResolvedValue(undefined),
      findByIdForIdentity: vi.fn().mockResolvedValue(null),
    });
    useCase = new CreateGoalUseCase(goalRepo, new GoalPolicy());
  });

  it('should create a goal and return ok result', async () => {
    const result = await useCase.execute(aCreateInput(), aContext());

    expect(result).toBeOk();
    expect(goalRepo.save).toHaveBeenCalledTimes(1);
    if (result.ok) {
      expect(result.data.readModel.name).toBe('Learn TypeScript');
      expect(result.data.readModel.id).toBeDefined();
    }
  });

  it('creates the goal and every initial key result with one aggregate save', async () => {
    const result = await useCase.execute(
      aCreateInput({
        initialKeyResults: [
          {
            title: 'Ship the reliable journey',
            valueType: 'Incremental',
            calculationMethod: 'Sum',
            startValue: 0,
            currentValue: 0,
            targetValue: 100,
            weight: 5,
          },
        ],
      }),
      aContext(),
    );

    expect(result).toBeOk();
    expect(goalRepo.save).toHaveBeenCalledTimes(1);
    expect(result.ok && result.data.readModel.keyResults).toHaveLength(1);
  });

  it('preserves caller-supplied aggregate and key-result IDs and replays the same durable fact', async () => {
    const goalId = GoalId.of('IGoalId_550e8400-e29b-41d4-a716-446655440000');
    const keyResultId = KeyResultId.of('IKeyResultId_550e8400-e29b-41d4-a716-446655440001');
    const input = aCreateInput({
      id: goalId,
      initialKeyResults: [
        {
          id: keyResultId,
          title: 'Pass the reference acceptance journey',
          valueType: 'Incremental',
          calculationMethod: 'Sum',
          startValue: 0,
          currentValue: 0,
          targetValue: 1,
          weight: 5,
        },
      ],
    });

    const first = await useCase.execute(input, aContext());

    expect(first).toBeOk();
    expect(first.ok && first.data.goalId).toBe(goalId);
    expect(first.ok && first.data.affectedEntityIds.keyResultIds).toEqual([keyResultId]);
    const persisted = vi.mocked(goalRepo.save).mock.calls[0]?.[0];
    expect(persisted?.id).toBe(goalId);
    expect(persisted?.keyResults.map((keyResult) => keyResult.id)).toEqual([keyResultId]);

    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(persisted ?? null);
    vi.mocked(goalRepo.save).mockClear();

    const replay = await useCase.execute(input, aContext());

    expect(replay).toBeOk();
    expect(replay.ok && replay.data.goalId).toBe(goalId);
    expect(replay.ok && replay.data.affectedEntityIds.keyResultIds).toEqual([keyResultId]);
    expect(goalRepo.findByIdForIdentity).toHaveBeenCalledWith(testIdentityId, goalId, {
      includeChildren: true,
    });
    expect(goalRepo.save).not.toHaveBeenCalled();
  });

  it('should return VALIDATION_ERROR when name is empty', async () => {
    const result = await useCase.execute(aCreateInput({ name: '' }), aContext());

    expect(result).toBeErrorWithCode('VALIDATION_ERROR');
    expect(goalRepo.save).not.toHaveBeenCalled();
  });

  it('should return VALIDATION_ERROR when name is whitespace-only', async () => {
    const result = await useCase.execute(aCreateInput({ name: '   ' }), aContext());

    expect(result).toBeErrorWithCode('VALIDATION_ERROR');
  });

  it('should return UNAUTHORIZED when identityId is missing', async () => {
    const result = await useCase.execute(aCreateInput(), aContext({ identityId: '' }));

    expect(result).toBeErrorWithCode('UNAUTHORIZED');
  });

  it('should return NOT_FOUND when parentGoalId references a non-existent goal', async () => {
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(null);

    const result = await useCase.execute(
      aCreateInput({ parentGoalId: 'non-existent-id' }),
      aContext(),
    );

    expect(result).toBeErrorWithCode('NOT_FOUND');
  });

  it('should create a goal with parent when parent exists', async () => {
    const parentGoal = Goal.create({
      identityId: testIdentityId,
      name: 'Parent Goal',
      description: null,
      color: '#3B82F6',
      feasibilityAnalysis: null,
      motivation: null,
      importance: 'MEDIUM' as any,
      category: null,
      tags: [],
      startDate: null,
      targetDate: null,
      folderId: null,
      parentGoalId: null,
      reminderConfig: null,
    });
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(parentGoal);

    const result = await useCase.execute(aCreateInput({ parentGoalId: parentGoal.id }), aContext());

    expect(result).toBeOk();
  });

  it('should use default color when none provided', async () => {
    const result = await useCase.execute(aCreateInput({ color: undefined }), aContext());

    expect(result).toBeOk();
  });

  it('should use provided tags', async () => {
    const result = await useCase.execute(aCreateInput({ tags: ['fitness', 'health'] }), aContext());

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.readModel.tags).toEqual(['fitness', 'health']);
    }
  });

  it('replays the same durable goal when a concurrent save hits the unique constraint and the goal was committed', async () => {
    const goalId = GoalId.of('IGoalId_550e8400-e29b-41d4-a716-446655440002');
    const input = aCreateInput({ id: goalId });
    const committed = Goal.create({
      id: goalId,
      identityId: testIdentityId,
      name: 'Learn TypeScript',
      description: null,
      color: '#3B82F6',
      feasibilityAnalysis: null,
      motivation: null,
      importance: 'Important',
      category: null,
      tags: [],
      startDate: null,
      targetDate: null,
      folderId: null,
      parentGoalId: null,
      reminderConfig: null,
    });
    committed.createAndAddKeyResult({
      title: 'Ship the reference journey',
      valueType: 'Incremental',
      startValue: 0,
      targetValue: 1,
      weight: 5,
    });

    // Both workers pass the pre-check (not found), then the slower worker's save
    // hits the unique constraint while the other worker already committed.
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValueOnce(null).mockResolvedValueOnce(committed);
    vi.mocked(goalRepo.save).mockRejectedValueOnce(
      new Error('duplicate key value violates unique constraint "goals_pkey"'),
    );

    const result = await useCase.execute(input, aContext());

    expect(result).toBeOk();
    expect(result.ok && result.data.goalId).toBe(goalId);
    expect(goalRepo.findByIdForIdentity).toHaveBeenCalledTimes(2);
    expect(goalRepo.save).toHaveBeenCalledTimes(1);
  });

  it('returns INTERNAL_ERROR instead of throwing when a non-idempotent save fails and no goal is committed', async () => {
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(null);
    vi.mocked(goalRepo.save).mockRejectedValueOnce(new Error('connection reset'));

    const result = await useCase.execute(aCreateInput(), aContext());

    expect(result).toBeErrorWithCode('INTERNAL_ERROR');
    expect(goalRepo.save).toHaveBeenCalledTimes(1);
  });
});
