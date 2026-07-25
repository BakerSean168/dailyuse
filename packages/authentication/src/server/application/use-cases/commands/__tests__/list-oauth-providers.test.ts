import { describe, expect, it } from 'vitest';
import { ListOAuthProvidersUseCase } from '../list-oauth-providers.use-case';

describe('ListOAuthProvidersUseCase', () => {
  it('marks GitHub disabled when not configured', async () => {
    const useCase = new ListOAuthProvidersUseCase();
    const result = await useCase.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      const github = result.data.providers.find((p) => p.provider === 'Github');
      expect(github?.enabled).toBe(false);
    }
  });

  it('marks GitHub enabled for e2e-mock config', async () => {
    const useCase = new ListOAuthProvidersUseCase({ clientId: 'e2e-mock' });
    const result = await useCase.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      const github = result.data.providers.find((p) => p.provider === 'Github');
      expect(github?.enabled).toBe(true);
    }
  });
});
