import { describe, expect, it, vi } from 'vitest';

import type { PrismaClient } from '@dailyuse/database';
import { LangGraphCheckpointPrismaAdapter } from '../langgraph-checkpoint-prisma.adapter';

describe('LangGraphCheckpointPrismaAdapter', () => {
  it('round-trips a checkpoint tuple with pending writes', async () => {
    const prisma = {
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([
          {
            identityId: 'identity-1',
            agentType: 'goal.create',
            threadId: 'thread-1',
            checkpointNs: '',
            checkpointId: 'checkpoint-1',
            parentCheckpointId: null,
            checkpointType: 'msgpack',
            checkpointData: Buffer.from('checkpoint'),
            metadataType: 'msgpack',
            metadataData: Buffer.from('metadata'),
            createdAt: new Date('2026-06-13T00:00:00.000Z'),
          },
        ])
        .mockResolvedValueOnce([
          {
            taskId: 'task-1',
            taskPath: 'plan.approval',
            idx: -3,
            channel: '__interrupt__',
            valueType: 'msgpack',
            valueData: Buffer.from('interrupt'),
            createdAt: new Date('2026-06-13T00:00:01.000Z'),
          },
        ]),
      $executeRaw: vi.fn(async () => 1),
      $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
    };

    const adapter = new LangGraphCheckpointPrismaAdapter(prisma as unknown as PrismaClient);
    const record = await adapter.getCheckpoint({
      identityId: 'identity-1',
      agentType: 'goal.create',
      threadId: 'thread-1',
      checkpointId: 'checkpoint-1',
    });

    expect(record).toEqual({
      identityId: 'identity-1',
      agentType: 'goal.create',
      threadId: 'thread-1',
      checkpointNs: '',
      checkpointId: 'checkpoint-1',
      parentCheckpointId: null,
      checkpoint: {
        type: 'msgpack',
        data: Buffer.from('checkpoint').toString('base64'),
      },
      metadata: {
        type: 'msgpack',
        data: Buffer.from('metadata').toString('base64'),
      },
      createdAt: '2026-06-13T00:00:00.000Z',
      pendingWrites: [
        {
          taskId: 'task-1',
          taskPath: 'plan.approval',
          idx: -3,
          channel: '__interrupt__',
          value: {
            type: 'msgpack',
            data: Buffer.from('interrupt').toString('base64'),
          },
          createdAt: '2026-06-13T00:00:01.000Z',
        },
      ],
    });
  });

  it('persists checkpoint writes and deletes a thread', async () => {
    const prisma = {
      $queryRaw: vi.fn(async () => []),
      $executeRaw: vi.fn(async () => 1),
      $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
    };

    const adapter = new LangGraphCheckpointPrismaAdapter(prisma as unknown as PrismaClient);

    await adapter.putWrites({
      identityId: 'identity-1',
      agentType: 'goal.create',
      threadId: 'thread-1',
      checkpointId: 'checkpoint-1',
      taskId: 'task-1',
      writes: [
        { idx: 0, channel: 'messages', value: { type: 'msgpack', data: Buffer.from('m').toString('base64') } },
        { idx: -3, channel: '__interrupt__', value: { type: 'msgpack', data: Buffer.from('i').toString('base64') } },
      ],
    });
    await adapter.deleteThread({
      identityId: 'identity-1',
      agentType: 'goal.create',
      threadId: 'thread-1',
    });

    expect(prisma.$executeRaw).toHaveBeenCalledTimes(4);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
