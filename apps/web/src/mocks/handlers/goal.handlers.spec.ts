import { createMockGoalAggregateResponse, goalMockRoutes } from './goal.handlers';
import {
  createHttpClientSpy,
  expectSchemaFailure,
  expectSchemaSuccess,
  successResult,
} from './_shared/contract-test-helpers';
import { describe, expect, it } from 'vitest';
import {
  CloneGoalSchema,
  CreateGoalSchema,
  GetGoalAggregateResSchema,
  QueryGoalsResSchema,
  UpdateGoalSchema,
} from '@dailyuse/contracts/goal';
import { createMockGoal, createMockQueryGoalsRes } from '@dailyuse/contracts/mocks';

describe('goal handlers contracts', () => {
  it('uses the current goal adapter route prefixes', () => {
    expect(goalMockRoutes.goals).toMatch(/\/goals$/);
    expect(goalMockRoutes.folders).toMatch(/\/goal-folders$/);
  });

  it('keeps goal aggregate and query response shapes aligned with contracts', () => {
    const aggregateResponse = createMockGoalAggregateResponse(createMockGoal().id);

    expectSchemaSuccess(GetGoalAggregateResSchema, aggregateResponse);
    expectSchemaSuccess(QueryGoalsResSchema, createMockQueryGoalsRes(3));
  });

  it(
    'uses name-based create, update, search, aggregate, and clone contracts',
    async () => {
      const { GoalHttpAdapter } = await import('@dailyuse/goal/client');
      const httpClient = createHttpClientSpy();
      const adapter = new GoalHttpAdapter(httpClient);
      const aggregateResponse = createMockGoalAggregateResponse(createMockGoal().id);
      const queryResponse = createMockQueryGoalsRes(2);

      httpClient.post
        .mockResolvedValueOnce(successResult(createMockGoal()))
        .mockResolvedValueOnce(successResult(createMockGoal()));
      httpClient.patch.mockResolvedValueOnce(successResult(createMockGoal()));
      httpClient.get
        .mockResolvedValueOnce(successResult(queryResponse))
        .mockResolvedValueOnce(successResult(aggregateResponse));

      const createPayload = expectSchemaSuccess(CreateGoalSchema, {
        name: 'Ship web contracts',
        importance: 'Important',
        description: 'Unify adapter payloads',
      });
      const updatePayload = expectSchemaSuccess(UpdateGoalSchema, {
        name: 'Ship web contracts v2',
        description: 'Updated scope',
      });
      const clonePayload = expectSchemaSuccess(CloneGoalSchema, {
        name: 'Ship web contracts (copy)',
        includeKeyResults: true,
      });

      expectSchemaFailure(CreateGoalSchema, {
        importance: 'Important',
      });
      expectSchemaFailure(CreateGoalSchema, {
        title: 'Legacy goal title',
        importance: 'Important',
      });
      expectSchemaFailure(UpdateGoalSchema, {
        title: 'Legacy goal title',
      });
      expectSchemaFailure(CloneGoalSchema, {
        title: 'Legacy goal title',
      });

      await adapter.createGoal(createPayload);
      await adapter.updateGoal('goal-1', updatePayload);
      await adapter.searchGoals({ query: 'contracts', page: 1, limit: 20 });
      await adapter.getGoalAggregateView('goal-1');
      await adapter.cloneGoal('goal-1', clonePayload);

      expect(httpClient.post).toHaveBeenNthCalledWith(1, '/goals', createPayload);
      expect(httpClient.patch).toHaveBeenCalledWith('/goals/goal-1', updatePayload);
      expect(httpClient.get).toHaveBeenNthCalledWith(1, '/goals/search', {
        params: { query: 'contracts', page: 1, limit: 20 },
      });
      expect(httpClient.get).toHaveBeenNthCalledWith(2, '/goals/goal-1/aggregate');
      expect(httpClient.post).toHaveBeenNthCalledWith(2, '/goals/goal-1/clone', clonePayload);
      expect(createPayload).not.toHaveProperty('title');
      expect(updatePayload).not.toHaveProperty('title');
      expect(clonePayload).not.toHaveProperty('title');
    },
    30_000,
  );
});
