/**
 * Conversation repository surface (stage-6 residual):
 * Host path only uses save/findById/findByIdentityId/delete.
 * findByStatus/findRecent/exists were unwired after conversation use-case collapse.
 */
import { describe, expect, it } from 'vitest';
import { AIConversationMemoryRepository } from '../memory/ai-conversation-memory.repository';
import type { IAIConversationRepository } from '../../../domain';

describe('AIConversationRepository surface', () => {
  it('memory adapter implements only the wired repository methods', () => {
    const repo: IAIConversationRepository = new AIConversationMemoryRepository();
    const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(repo))
      .filter((key) => key !== 'constructor')
      .sort();

    expect(keys).toEqual(
      expect.arrayContaining(['save', 'findById', 'findByIdentityId', 'delete']),
    );
    expect(keys).not.toContain('findByStatus');
    expect(keys).not.toContain('findRecent');
    expect(keys).not.toContain('exists');

    // Runtime shape used by use cases.
    expect(typeof repo.save).toBe('function');
    expect(typeof repo.findById).toBe('function');
    expect(typeof repo.findByIdentityId).toBe('function');
    expect(typeof repo.delete).toBe('function');
    expect((repo as { findByStatus?: unknown }).findByStatus).toBeUndefined();
    expect((repo as { findRecent?: unknown }).findRecent).toBeUndefined();
    expect((repo as { exists?: unknown }).exists).toBeUndefined();
  });
});
