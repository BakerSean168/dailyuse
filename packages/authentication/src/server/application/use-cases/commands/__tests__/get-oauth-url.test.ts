import { describe, expect, it } from 'vitest';
import { InMemoryOAuthStateStore } from '../../../../infrastructure/services/in-memory-oauth-state-store';
import { GetOAuthUrlUseCase } from '../get-oauth-url.use-case';

describe('GetOAuthUrlUseCase', () => {
  it('returns SERVICE_UNAVAILABLE when GitHub is not configured', async () => {
    const useCase = new GetOAuthUrlUseCase(new InMemoryOAuthStateStore());
    const result = await useCase.execute({ provider: 'Github' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SERVICE_UNAVAILABLE');
    }
  });

  it('returns authorize URL with state and PKCE for GitHub', async () => {
    const store = new InMemoryOAuthStateStore();
    const useCase = new GetOAuthUrlUseCase(store, { clientId: 'client-123' });
    const result = await useCase.execute({
      provider: 'Github',
      redirectUri: 'http://127.0.0.1:5173/auth/oauth/callback',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const url = new URL(result.data.authUrl);
      expect(url.origin + url.pathname).toBe('https://github.com/login/oauth/authorize');
      expect(url.searchParams.get('client_id')).toBe('client-123');
      expect(url.searchParams.get('state')).toBe(result.data.state);
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('scope')).toContain('read:user');
      expect(url.searchParams.get('scope')).not.toContain('repo');
      expect(store.consume(result.data.state, 'Github')).not.toBeNull();
    }
  });
});


  it('returns local callback URL for e2e-mock client without repo scopes', async () => {
    const store = new InMemoryOAuthStateStore();
    const useCase = new GetOAuthUrlUseCase(store, {
      clientId: 'e2e-mock',
      mockSubjectId: 'subject-7',
    });
    const result = await useCase.execute({
      provider: 'Github',
      redirectUri: 'http://127.0.0.1:5173/auth',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const url = new URL(result.data.authUrl);
      expect(url.origin + url.pathname).toBe('http://127.0.0.1:5173/auth');
      expect(url.searchParams.get('code')).toBe('e2e-github-subject-7');
      expect(url.searchParams.get('state')).toBe(result.data.state);
      expect(url.toString()).not.toContain('repo');
      expect(store.consume(result.data.state, 'Github')).not.toBeNull();
    }
  });
