import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@memoflow/database';
import type { IElectronDatabase, IElectronDatabaseTransaction } from '@memoflow/contracts/electron';
import { ConversationStatus, MessageRole } from '@memoflow/contracts/ai';
import type { AIEventMap } from '@memoflow/contracts/ai';
import { createTypedEventSubscriber, eventBus } from '@memoflow/utils/domain';
import { AIConversation } from '../../../domain/aggregates/ai-conversation';
import { Message } from '../../../domain/entities/message';
import { AIConversationPrismaRepository } from '../prisma/ai-conversation-prisma.repository';
import { PowerSyncAIConversationRepository } from '../powersync/ai-conversation-powersync.repository';

const aiConversationEventTypes = [
  'ai:conversation-created',
  'ai:message-added',
  'ai:conversation-updated',
  'ai:conversation-status-changed',
] as const satisfies ReadonlyArray<keyof AIEventMap>;

const aiEventSubscriber = createTypedEventSubscriber<AIEventMap>(eventBus);

function createConversationWithPendingEvents(): AIConversation {
  const conversation = AIConversation.create({
    identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
    name: 'Architecture Review',
  });

  conversation.addMessage(
    Message.create({
      conversationId: String(conversation.id),
      role: MessageRole.User,
      content: 'Please review the runtime seams.',
    }),
  );
  conversation.rename('Architecture Review 2');
  conversation.updateStatus(ConversationStatus.Archived);

  return conversation;
}

function captureConversationEventTypes(): {
  received: Array<(typeof aiConversationEventTypes)[number]>;
  dispose(): void;
} {
  const received: Array<(typeof aiConversationEventTypes)[number]> = [];
  const handlers = aiConversationEventTypes.map((eventType) => {
    const handler = () => {
      received.push(eventType);
    };
    aiEventSubscriber.on(eventType, handler);
    return { eventType, handler };
  });

  return {
    received,
    dispose() {
      for (const { eventType, handler } of handlers) {
        aiEventSubscriber.off(eventType, handler);
      }
    },
  };
}

function createPrismaClientMock(): PrismaClient {
  const client = {
    aiConversation: {
      // Residual 1331: save path owns via findUnique before upsert.
      findUnique: vi.fn(async () => null),
      upsert: vi.fn(async () => undefined),
    },
    aiMessage: {
      deleteMany: vi.fn(async () => undefined),
      createMany: vi.fn(async () => ({ count: 1 })),
    },
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(client)),
  };
  return client as unknown as PrismaClient;
}

function createElectronDatabaseMock(): IElectronDatabase {
  const tx: IElectronDatabaseTransaction = {
    execute: vi.fn(async () => ({ rowsAffected: 1 })),
    getAll: vi.fn(async () => []),
    getOptional: vi.fn(async () => null),
    get: vi.fn(async () => {
      throw new Error('get() should not be called in this test');
    }),
  };

  return {
    execute: vi.fn(async () => ({ rowsAffected: 1 })),
    getAll: vi.fn(async () => []),
    getOptional: vi.fn(async () => null),
    get: vi.fn(async () => {
      throw new Error('get() should not be called in this test');
    }),
    writeTransaction: vi.fn(async <T>(callback: (transaction: IElectronDatabaseTransaction) => Promise<T>) =>
      callback(tx),
    ),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AIConversation repositories domain-event flush', () => {
  it('Prisma repository publishes the pending AI conversation domain events through the shared flush helper', async () => {
    const capture = captureConversationEventTypes();
    const repository = new AIConversationPrismaRepository(createPrismaClientMock());
    const conversation = createConversationWithPendingEvents();

    try {
      await repository.save(conversation);

      expect(capture.received).toEqual([...aiConversationEventTypes]);
      expect(conversation.pullDomainEvents()).toHaveLength(0);
    } finally {
      capture.dispose();
    }
  });

  it('PowerSync repository publishes the same pending AI conversation domain events through the shared flush helper', async () => {
    const capture = captureConversationEventTypes();
    const repository = new PowerSyncAIConversationRepository(createElectronDatabaseMock());
    const conversation = createConversationWithPendingEvents();

    try {
      await repository.save(conversation);

      expect(capture.received).toEqual([...aiConversationEventTypes]);
      expect(conversation.pullDomainEvents()).toHaveLength(0);
    } finally {
      capture.dispose();
    }
  });
});
