import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import { AuthIdentity, AuthDomainCode, OAuthProvider } from '@/server/domain';
import type { IAuthIdentityRepository } from '@/server/domain';
import { InMemoryOAuthStateStore } from '@/server/infrastructure/services/in-memory-oauth-state-store';
import { BindOAuthUseCase } from '../bind-oauth.use-case';
import { UnbindOAuthUseCase } from '../unbind-oauth.use-case';
import type { IGithubOAuthClient } from '@/server/domain/services/providers/i-github-oauth-client';

const cx = { identityId: 'will-set' } as ExecutionContext;

const createRepo = (
  overrides: Partial<IAuthIdentityRepository> = {},
): IAuthIdentityRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findByEmail: vi.fn().mockResolvedValue(null),
  findByOAuth: vi.fn().mockResolvedValue(null),
  existsByEmail: vi.fn().mockResolvedValue(false),
  delete: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('BindOAuthUseCase / UnbindOAuthUseCase', () => {
  let store: InMemoryOAuthStateStore;
  let oauthClient: IGithubOAuthClient;

  beforeEach(() => {
    store = new InMemoryOAuthStateStore();
    oauthClient = {
      exchangeCodeForIdentity: vi.fn().mockResolvedValue({
        subjectId: 'gh-99',
        username: 'octocat',
        email: null,
      }),
    };
  });

  it('binds GitHub subject to the current identity without storing provider tokens', async () => {
    const identity = await AuthIdentity.createWithEmailAndPassword({
      email: 'user@example.com',
      plainPassword: 'StrongP@ss1',
      hasher: {
        hash: vi.fn().mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=4$bW9ja3NhbHQ$bW9ja2hhc2h2YWx1ZQ'),
        compare: vi.fn().mockResolvedValue(true),
      } as any,
    });
    cx.identityId = String(identity.id);
    const repo = createRepo({
      findById: vi.fn().mockResolvedValue(identity),
      findByOAuth: vi.fn().mockResolvedValue(null),
    });
    const issued = store.issue({ provider: 'Github' });
    const useCase = new BindOAuthUseCase(repo, store, oauthClient);

    const result = await useCase.execute(
      { provider: 'Github', code: 'code-1', state: issued.state },
      cx,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.created).toBe(true);
      expect(result.data.providerSubjectId).toBe('gh-99');
    }
    expect(identity.hasOAuth()).toBe(true);
    expect(identity.getOAuthBindings()[0].accessToken).toBeNull();
    expect(repo.save).toHaveBeenCalled();
  });

  it('rejects binding when the GitHub subject already belongs to another identity', async () => {
    const current = AuthIdentity.createWithOAuth({
      provider: OAuthProvider.Google,
      sub: 'google-1',
    });
    cx.identityId = String(current.id);
    const owner = AuthIdentity.createWithOAuth({
      provider: OAuthProvider.Github,
      sub: 'gh-99',
    });
    const repo = createRepo({
      findById: vi.fn().mockResolvedValue(current),
      findByOAuth: vi.fn().mockResolvedValue(owner),
    });
    const issued = store.issue({ provider: 'Github' });
    const useCase = new BindOAuthUseCase(repo, store, oauthClient);

    const result = await useCase.execute(
      { provider: 'Github', code: 'code-1', state: issued.state },
      cx,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONFLICT');
      expect(result.error.context?.domainCode).toBe(AuthDomainCode.OAUTH_ALREADY_LINKED);
    }
  });

  it('unbinds GitHub when another login path remains', async () => {
    const identity = await AuthIdentity.createWithEmailAndPassword({
      email: 'user@example.com',
      plainPassword: 'StrongP@ss1',
      hasher: {
        hash: vi.fn().mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=4$bW9ja3NhbHQ$bW9ja2hhc2h2YWx1ZQ'),
        compare: vi.fn().mockResolvedValue(true),
      } as any,
    });
    // attach oauth
    const { OAuthBinding, AuthCredentialId } = await import('@/server/domain');
    identity.addOAuthBinding(
      OAuthBinding.create({
        id: AuthCredentialId.generate(),
        provider: OAuthProvider.Github,
        providerSubjectId: 'gh-99',
      }),
    );
    cx.identityId = String(identity.id);
    const repo = createRepo({ findById: vi.fn().mockResolvedValue(identity) });
    const useCase = new UnbindOAuthUseCase(repo);

    const result = await useCase.execute({ provider: 'Github' }, cx);
    expect(result.ok).toBe(true);
    expect(identity.hasOAuth()).toBe(false);
  });

  it('refuses to unbind the last login path', async () => {
    const identity = AuthIdentity.createWithOAuth({
      provider: OAuthProvider.Github,
      sub: 'gh-only',
    });
    cx.identityId = String(identity.id);
    const repo = createRepo({ findById: vi.fn().mockResolvedValue(identity) });
    const useCase = new UnbindOAuthUseCase(repo);

    const result = await useCase.execute({ provider: 'Github' }, cx);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONFLICT');
      expect(result.error.context?.domainCode).toBe(AuthDomainCode.LAST_LOGIN_PATH);
    }
  });
});
