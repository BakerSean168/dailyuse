import { describe, expect, it, vi } from 'vitest';
import { MessageRole } from '@memoflow/contracts/ai';
import type { IAIConversationRepository } from '../../domain/repositories/i-ai-conversation-repository';
import { ConversationTranscriptBootstrapSource } from './conversation-transcript-bootstrap.source';

function repository(findResult: unknown) {
  return {
    save: vi.fn(),
    findByIdForIdentity: vi.fn().mockResolvedValue(findResult),
    findByIdentityId: vi.fn(),
    delete: vi.fn(),
  } as unknown as IAIConversationRepository;
}

describe('ConversationTranscriptBootstrapSource', () => {
  it('projects an owned legacy transcript without writing AiMessage state', async () => {
    const conversation = {
      name: 'Legacy conversation',
      deletedAt: null,
      getAllMessages: () => [
        {
          id: 'legacy-user-1',
          role: MessageRole.User,
          content: 'hello',
          createdAt: new Date('2026-08-20T00:00:00.000Z'),
          deletedAt: null,
        },
        {
          id: 'legacy-assistant-1',
          role: MessageRole.Assistant,
          content: 'hi',
          createdAt: new Date('2026-08-20T00:00:01.000Z'),
          deletedAt: null,
        },
        {
          id: 'legacy-deleted',
          role: MessageRole.System,
          content: 'deleted',
          createdAt: new Date('2026-08-20T00:00:02.000Z'),
          deletedAt: new Date('2026-08-20T00:00:03.000Z'),
        },
      ],
    };
    const conversations = repository(conversation);
    const source = new ConversationTranscriptBootstrapSource(conversations);

    await expect(
      source.load({ identityId: 'identity-1', conversationId: 'conversation-1' }),
    ).resolves.toEqual({
      title: 'Legacy conversation',
      messages: [
        {
          id: 'legacy-user-1',
          role: 'user',
          content: 'hello',
          createdAt: Date.parse('2026-08-20T00:00:00.000Z'),
        },
        {
          id: 'legacy-assistant-1',
          role: 'assistant',
          content: 'hi',
          createdAt: Date.parse('2026-08-20T00:00:01.000Z'),
        },
      ],
    });

    expect(conversations.findByIdForIdentity).toHaveBeenCalledWith('identity-1', 'conversation-1', {
      includeChildren: true,
    });
    expect(conversations.save).not.toHaveBeenCalled();
    expect(conversations.delete).not.toHaveBeenCalled();
  });

  it('returns null for a foreign/missing/deleted conversation instead of creating a new authority path', async () => {
    const missing = repository(null);
    await expect(
      new ConversationTranscriptBootstrapSource(missing).load({
        identityId: 'identity-1',
        conversationId: 'foreign-conversation',
      }),
    ).resolves.toBeNull();

    const deleted = repository({
      deletedAt: new Date(),
      name: 'Deleted',
      getAllMessages: () => [],
    });
    await expect(
      new ConversationTranscriptBootstrapSource(deleted).load({
        identityId: 'identity-1',
        conversationId: 'deleted-conversation',
      }),
    ).resolves.toBeNull();
  });
});
