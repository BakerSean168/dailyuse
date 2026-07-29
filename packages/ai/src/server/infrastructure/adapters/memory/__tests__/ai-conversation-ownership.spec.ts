import { describe, expect, it } from 'vitest';
import { ConversationStatus } from '@memoflow/contracts/ai';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { AIConversation } from '../../../../domain/aggregates/ai-conversation';
import { AIConversationMemoryRepository } from '../ai-conversation-memory.repository';

describe('AIConversationMemoryRepository ownership', () => {
  it('returns null for foreign identity reads and refuses cross-identity save/delete', async () => {
    const repo = new AIConversationMemoryRepository();
    const owned = AIConversation.create({ identityId: 'identity-1', name: 'owned' });
    await repo.save(owned);

    await expect(repo.findByIdForIdentity('identity-other', String(owned.id))).resolves.toBeNull();
    await expect(repo.findByIdForIdentity('identity-1', String(owned.id))).resolves.toMatchObject({
      name: 'owned',
    });

    const foreign = AIConversation.load({
      id: owned.id,
      identityId: IdentityId.of('identity-other'),
      name: 'takeover',
      status: ConversationStatus.Active,
      messageCount: 0,
      lastMessageAt: null,
      version: owned.version,
      createdAt: owned.createdAt,
      updatedAt: owned.updatedAt,
      deletedAt: null,
      messages: [],
    });

    await expect(repo.save(foreign)).rejects.toThrow(/current identity/);
    await expect(repo.delete('identity-other', String(owned.id))).rejects.toThrow(/current identity/);
    await expect(repo.delete('identity-1', String(owned.id))).resolves.toBeUndefined();
    await expect(repo.findByIdForIdentity('identity-1', String(owned.id))).resolves.toBeNull();
  });
});
