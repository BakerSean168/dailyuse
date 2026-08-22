import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@memoflow/database';
import type { IElectronDatabase } from '@memoflow/contracts/electron';
import { AIExecutionLogPrismaAdapter } from '../prisma/ai-execution-log-prisma.adapter';
import { AIExecutionLogPowerSyncAdapter } from '../powersync/ai-execution-log-powersync.adapter';

const logInput = {
  identityId: 'identity-1',
  taskType: 'MASTRA_ASSISTANT_TURN',
  status: 'COMPLETED' as const,
  conversationId: 'conversation-1',
  runId: 'run-1',
  requestId: 'request-1',
  traceId: 'trace-1',
  providerId: 'provider-1',
  providerName: 'OpenAI Compatible',
  model: 'gpt-4o-mini',
  input: { contentLength: 12 },
  result: { outcome: 'assistant.run.completed' },
  tokenUsage: { promptTokens: 100, completionTokens: 20, totalTokens: 120 },
  costEstimate: {
    promptCostUsd: 0.000015,
    completionCostUsd: 0.000012,
    totalCostUsd: 0.000027,
    pricingVersion: 'static-v1',
    pricingModel: 'gpt-4o-mini',
  },
  processingMs: 42,
};

describe('AI execution-log indexed usage projection', () => {
  it('Prisma writes indexed correlation fields and sums usage under the authenticated identity', async () => {
    const create = vi.fn(async () => ({}));
    const findMany = vi.fn(async () => [
      { tokenUsage: JSON.stringify(logInput.tokenUsage), estimatedCostUsd: 0.000027 },
      {
        tokenUsage: JSON.stringify({ promptTokens: 50, completionTokens: 10, totalTokens: 60 }),
        estimatedCostUsd: 0.0000135,
      },
    ]);
    const prisma = { aiGenerationTask: { create, findMany } } as unknown as PrismaClient;
    const adapter = new AIExecutionLogPrismaAdapter(prisma);

    await adapter.record(logInput);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        identityId: 'identity-1',
        conversationId: 'conversation-1',
        runId: 'run-1',
        requestId: 'request-1',
        traceId: 'trace-1',
        providerId: 'provider-1',
        model: 'gpt-4o-mini',
        estimatedCostUsd: 0.000027,
      }),
    });

    const summary = await adapter.summarizeUsage({
      identityId: 'identity-1',
      conversationId: 'conversation-1',
    });
    expect(summary).toMatchObject({
      executionCount: 2,
      promptTokens: 150,
      completionTokens: 30,
      totalTokens: 180,
    });
    expect(summary.estimatedCost).toBeCloseTo(0.0000405, 10);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          identityId: 'identity-1',
          conversationId: 'conversation-1',
          deletedAt: null,
        }),
      }),
    );
  });

  it('PowerSync binds identity and run as SQL predicates rather than filtering JSON in memory', async () => {
    const execute = vi.fn(async () => ({ rowsAffected: 1 }));
    const getAll = vi.fn(async () => [
      { token_usage: JSON.stringify(logInput.tokenUsage), estimated_cost_usd: 0.000027 },
    ]);
    const db = { execute, getAll } as unknown as IElectronDatabase;
    const adapter = new AIExecutionLogPowerSyncAdapter(db);

    await adapter.record(logInput);
    expect(execute.mock.calls[0]?.[0]).toContain('conversation_id, run_id, request_id, trace_id');
    expect(execute.mock.calls[0]?.[1]).toContain('conversation-1');
    expect(execute.mock.calls[0]?.[1]).toContain('run-1');

    await expect(adapter.summarizeUsage({ identityId: 'identity-1', runId: 'run-1' })).resolves.toEqual({
      executionCount: 1,
      promptTokens: 100,
      completionTokens: 20,
      totalTokens: 120,
      estimatedCost: 0.000027,
    });
    expect(getAll.mock.calls[0]?.[0]).toContain('identity_id = ?');
    expect(getAll.mock.calls[0]?.[0]).toContain('run_id = ?');
    expect(getAll.mock.calls[0]?.[1]).toEqual(['identity-1', 'run-1']);
  });
});
