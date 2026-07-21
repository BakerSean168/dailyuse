/**
 * Pluggable Authentication — composition-root integration.
 * 可插拔认证 —— 组合根集成测试。
 *
 * Proves the "abstract login interface + pluggable methods" design end to end,
 * through the real composition root (`createAuthenticationUseCases`), with:
 * - the default password provider always present;
 * - an extra GitHub provider layered in via `authenticationProviders`;
 * - a fake GitHub OAuth client (no network) and in-memory repositories.
 *
 * 通过真实组合根验证"抽象登录接口 + 可插拔方式"设计端到端可用。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAuthenticationUseCases } from '../authentication.module';
import {
  GithubAuthenticationProvider,
  type IGithubOAuthClient,
  type IAuthIdentityRepository,
  type IAuthSessionRepository,
  type IPasswordHasher,
  type ITokenProvider,
  AuthIdentity,
  AuthSession,
  OAuthProvider,
} from '../../domain';
import type { AuthSessionId, IdentityId } from '@dailyuse/contracts/authentication';

// ---------------------------------------------------------------------------
// In-memory test doubles
// ---------------------------------------------------------------------------

class InMemoryIdentityRepo implements IAuthIdentityRepository {
  private byId = new Map<string, AuthIdentity>();

  async save(identity: AuthIdentity): Promise<void> {
    this.byId.set(identity.id, identity);
  }
  async findById(id: IdentityId): Promise<AuthIdentity | null> {
    return this.byId.get(id) ?? null;
  }
  async findByEmail(email: string): Promise<AuthIdentity | null> {
    for (const identity of this.byId.values()) {
      if (identity.findIdentifierByEmail(email)) return identity;
    }
    return null;
  }
  async findByOAuth(
    provider: OAuthProvider,
    subjectId: string,
  ): Promise<AuthIdentity | null> {
    for (const identity of this.byId.values()) {
      const bound = identity
        .getOAuthBindings()
        .some((b) => b.provider === provider && b.providerSubjectId === subjectId);
      if (bound) return identity;
    }
    return null;
  }
  async existsByEmail(email: string): Promise<boolean> {
    return (await this.findByEmail(email)) !== null;
  }
  async delete(identity: AuthIdentity): Promise<void> {
    this.byId.delete(identity.id);
  }

  get size(): number {
    return this.byId.size;
  }
}

class InMemorySessionRepo implements IAuthSessionRepository {
  readonly saved: AuthSession[] = [];
  async save(session: AuthSession): Promise<void> {
    this.saved.push(session);
  }
  async findById(_id: AuthSessionId): Promise<AuthSession | null> {
    return null;
  }
  async findByIdentityId(): Promise<AuthSession[]> {
    return [];
  }
  async remove(): Promise<void> {}
  async removeAllByIdentityId(): Promise<void> {}
  async removeExpired(): Promise<void> {}
}

const stubHasher: IPasswordHasher = {
  hash: vi.fn().mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=4$bW9ja3NhbHQ$bW9ja2hhc2h2YWx1ZQ'),
  compare: vi.fn().mockResolvedValue(true),
};

const stubTokenProvider: ITokenProvider = {
  generateAccessToken: () => 'access',
  generateRefreshToken: () => 'refresh',
  verifyAccessToken: () => ({ ok: true, data: { identityId: 'x', sessionId: 'y' } }) as never,
  verifyRefreshToken: () => ({ ok: true, data: { identityId: 'x', sessionId: 'y' } }) as never,
  generateAuthTokens: () => ({ accessToken: 'access', refreshToken: 'refresh', expiresIn: 900 }),
  hash: (t: string) => `hashed:${t}`,
};

function fakeGithubClient(subjectId: string): IGithubOAuthClient {
  return {
    exchangeCodeForIdentity: vi.fn().mockResolvedValue({
      subjectId,
      username: 'octocat',
      email: 'octocat@example.com',
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Pluggable authentication (composition root)', () => {
  let identityRepo: InMemoryIdentityRepo;
  let sessionRepo: InMemorySessionRepo;

  beforeEach(() => {
    identityRepo = new InMemoryIdentityRepo();
    sessionRepo = new InMemorySessionRepo();
  });

  it('registers the password provider by default (no extra providers)', async () => {
    const useCases = createAuthenticationUseCases({
      identityRepository: identityRepo,
      sessionRepository: sessionRepo,
      passwordHasher: stubHasher,
      tokenProvider: stubTokenProvider,
    });

    // Seed a password identity and authenticate via the unified use case.
    const identity = await AuthIdentity.createWithEmailAndPassword({
      email: 'user@example.com',
      plainPassword: 'StrongP@ss1',
      hasher: stubHasher,
    });
    await identityRepo.save(identity);

    const result = await useCases.authenticate.execute(
      'password',
      { email: 'user@example.com', password: 'StrongP@ss1' },
      { locale: 'en' } as never,
      'device-1',
    );

    expect(result.ok).toBe(true);
    expect(sessionRepo.saved).toHaveLength(1);
  });

  it('provisions a new identity on first GitHub login and reuses it afterwards', async () => {
    const githubProvider = new GithubAuthenticationProvider(
      fakeGithubClient('42'),
      identityRepo,
    );

    const useCases = createAuthenticationUseCases({
      identityRepository: identityRepo,
      sessionRepository: sessionRepo,
      passwordHasher: stubHasher,
      tokenProvider: stubTokenProvider,
      authenticationProviders: [githubProvider],
    });

    // First GitHub login -> provisions identity.
    const first = await useCases.authenticate.execute(
      'github',
      { code: 'code-1' },
      { locale: 'en' } as never,
      'device-1',
    );
    expect(first.ok).toBe(true);
    expect(identityRepo.size).toBe(1);

    // Second GitHub login (same subject) -> reuses identity, no duplicate.
    const second = await useCases.authenticate.execute(
      'github',
      { code: 'code-2' },
      { locale: 'en' } as never,
      'device-2',
    );
    expect(second.ok).toBe(true);
    expect(identityRepo.size).toBe(1);
    expect(sessionRepo.saved).toHaveLength(2);
  });

  it('returns SERVICE_UNAVAILABLE for an unregistered method', async () => {
    const useCases = createAuthenticationUseCases({
      identityRepository: identityRepo,
      sessionRepository: sessionRepo,
      passwordHasher: stubHasher,
      tokenProvider: stubTokenProvider,
    });

    const result = await useCases.authenticate.execute(
      'github', // not registered here
      { code: 'x' },
      { locale: 'en' } as never,
      'device-1',
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SERVICE_UNAVAILABLE');
    }
  });
});
