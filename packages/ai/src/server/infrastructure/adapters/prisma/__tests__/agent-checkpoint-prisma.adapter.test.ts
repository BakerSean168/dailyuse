import { describe, expect, it, vi } from 'vitest';
import { ResultErrorException } from '@dailyuse/contracts/result';
import type { PrismaClient } from '@dailyuse/database';
import { AgentCheckpointPrismaAdapter } from '../agent-checkpoint-prisma.adapter';

const baseRun = {
  runId: 'run-1',
  threadId: 'thread-1',
  conversationId: null,
  identityId: 'identity-1',
  agentType: 'knowledge.generate' as const,
  status: 'completed' as const,
  createdAt: 1,
  updatedAt: 2,
};

function createPrismaMock(overrides?: {
  existing?: { identityId: string } | null;
}) {
  const existing = overrides?.existing ?? null;
  const findUnique = vi.fn().mockResolvedValue(existing);
  const update = vi.fn().mockResolvedValue({});
  const create = vi.fn().mockResolvedValue({});
  const $transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      agentRunCheckpoint: {
        findUnique,
        update,
        create,
      },
    }),
  );

  return {
    prisma: { $transaction } as unknown as PrismaClient,
    findUnique,
    update,
    create,
    $transaction,
  };
}

describe('AgentCheckpointPrismaAdapter upsert ownership (residual 105)', () => {
  it('creates a checkpoint when runId is free for the authenticated identity', async () => {
    const { prisma, findUnique, create, update } = createPrismaMock({ existing: null });
    const adapter = new AgentCheckpointPrismaAdapter(prisma);

    await adapter.upsert({
      identityId: 'identity-1',
      run: baseRun,
      state: {
        stage: 'result',
        intent: 'knowledge-generate',
        messages: [],
        artifacts: [],
        citations: [],
        retrievedContext: [],
        pendingActions: [],
        approvedActions: [],
        executedActions: [],
        usage: {},
        errors: [],
      },
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: { runId: 'run-1' },
      select: { identityId: true },
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
  });

  it('updates when the same identity owns the runId', async () => {
    const { prisma, update, create } = createPrismaMock({
      existing: { identityId: 'identity-1' },
    });
    const adapter = new AgentCheckpointPrismaAdapter(prisma);

    await adapter.upsert({
      identityId: 'identity-1',
      run: { ...baseRun, status: 'waiting_approval' },
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  });

  it('fails closed when run.identityId spoofs a different identity', async () => {
    const { prisma, $transaction } = createPrismaMock({ existing: null });
    const adapter = new AgentCheckpointPrismaAdapter(prisma);

    await expect(
      adapter.upsert({
        identityId: 'identity-1',
        run: { ...baseRun, identityId: 'identity-other' },
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: expect.stringMatching(/does not match the authenticated identity/i),
    });
    expect($transaction).not.toHaveBeenCalled();
  });

  it('fails closed when runId is owned by a foreign identity', async () => {
    const { prisma, create, update } = createPrismaMock({
      existing: { identityId: 'identity-other' },
    });
    const adapter = new AgentCheckpointPrismaAdapter(prisma);

    await expect(
      adapter.upsert({
        identityId: 'identity-1',
        run: baseRun,
      }),
    ).rejects.toBeInstanceOf(ResultErrorException);

    await expect(
      adapter.upsert({
        identityId: 'identity-1',
        run: baseRun,
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: expect.stringMatching(/not owned by the current identity/i),
    });

    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});


describe('AgentCheckpointPrismaAdapter get/list metadata ownership (residual 107)', () => {
  it('get returns null when run metadata identity mismatches row owner', async () => {
    const findFirst = vi.fn().mockResolvedValue({
      runMetadata: {
        ...baseRun,
        identityId: 'identity-other',
      },
      stateSnapshot: null,
      events: [],
      interrupts: [],
    });
    const prisma = {
      agentRunCheckpoint: { findFirst },
    } as unknown as PrismaClient;
    const adapter = new AgentCheckpointPrismaAdapter(prisma);

    await expect(
      adapter.get({ identityId: 'identity-1', runId: 'run-1' }),
    ).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledWith({
      where: { runId: 'run-1', identityId: 'identity-1', deletedAt: null },
    });
  });

  it('list filters out runs whose metadata identity does not match the query identity', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        runMetadata: { ...baseRun, runId: 'run-own', identityId: 'identity-1' },
      },
      {
        runMetadata: { ...baseRun, runId: 'run-spoof', identityId: 'identity-other' },
      },
    ]);
    const prisma = {
      agentRunCheckpoint: { findMany },
    } as unknown as PrismaClient;
    const adapter = new AgentCheckpointPrismaAdapter(prisma);

    const runs = await adapter.list({ identityId: 'identity-1' });
    expect(runs).toEqual([
      expect.objectContaining({ runId: 'run-own', identityId: 'identity-1' }),
    ]);
  });
});
