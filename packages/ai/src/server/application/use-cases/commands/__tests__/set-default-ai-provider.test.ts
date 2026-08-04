import { describe, expect, it, vi } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import type { IAIProviderConfigRepository } from '../../../../domain/repositories/i-ai-provider-config-repository';
import { SetDefaultAIProviderUseCase } from '../set-default-ai-provider.use-case';

function repositoryWith(outcome: 'SET' | 'NOT_FOUND' | 'CONFLICT') {
  return {
    setDefaultForIdentity: vi.fn(async () => outcome),
  } as unknown as IAIProviderConfigRepository;
}

describe('SetDefaultAIProviderUseCase', () => {
  it('maps a competing default selection to a refreshable conflict', async () => {
    const useCase = new SetDefaultAIProviderUseCase(repositoryWith('CONFLICT'));

    const result = await useCase.execute('provider-1', { identityId: 'identity-1' });

    expect(result).toBeErrorWithCode('CONFLICT');
    if (!result.ok) expect(result.error.message).toContain('refresh');
  });

  it('distinguishes unavailable providers from concurrency conflicts', async () => {
    const useCase = new SetDefaultAIProviderUseCase(repositoryWith('NOT_FOUND'));

    const result = await useCase.execute('provider-1', { identityId: 'identity-1' });

    expect(result).toBeErrorWithCode('NOT_FOUND');
  });

  it('succeeds only after the repository commits the selection', async () => {
    const useCase = new SetDefaultAIProviderUseCase(repositoryWith('SET'));

    await expect(
      useCase.execute('provider-1', { identityId: 'identity-1' }),
    ).resolves.toMatchObject({
      ok: true,
    });
  });
});
