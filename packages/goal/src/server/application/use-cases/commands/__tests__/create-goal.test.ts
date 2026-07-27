import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { anIdentityId } from '@dailyuse/test-utils';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IGoalRepository } from '../../../../domain/repositories/i-goal-repository';
import { Goal, GoalPolicy } from '../../../../domain';
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
      expect(result.data.name).toBe('Learn TypeScript');
      expect(result.data.id).toBeDefined();
    }
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
      expect(result.data.tags).toEqual(['fitness', 'health']);
    }
  });
});
