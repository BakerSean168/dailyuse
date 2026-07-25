/**
 * Provider config repository surface (stage-6 residual 169):
 * Host path only uses save/findByIdForIdentity/findByIdentityId/
 * findDefaultByIdentityId/delete/clearDefaultForIdentity — no bare findById.
 */
import { describe, expect, it } from 'vitest';
import { AIProviderConfigMemoryRepository } from '../memory/ai-provider-config-memory.repository';
import type { IAIProviderConfigRepository } from '../../../domain';

describe('AIProviderConfigRepository surface', () => {
  it('memory adapter implements only the wired repository methods', () => {
    const repo: IAIProviderConfigRepository = new AIProviderConfigMemoryRepository();
    expect(typeof repo.save).toBe('function');
    expect(typeof repo.findByIdForIdentity).toBe('function');
    expect(typeof repo.findByIdentityId).toBe('function');
    expect(typeof repo.findDefaultByIdentityId).toBe('function');
    expect(typeof repo.delete).toBe('function');
    expect(typeof repo.clearDefaultForIdentity).toBe('function');
    expect((repo as { findById?: unknown }).findById).toBeUndefined();
    expect((repo as { findByIdentityIdAndName?: unknown }).findByIdentityIdAndName).toBeUndefined();
    expect((repo as { exists?: unknown }).exists).toBeUndefined();
  });
});
