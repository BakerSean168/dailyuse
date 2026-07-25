/**
 * GithubAuthenticationProvider Tests
 *
 * Confirms GitHub login is identity-only and keyed by the stable numeric
 * subject id: existing bindings resolve to the same identity, first-time
 * logins provision a new identity, and no repository access is requested.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GithubAuthenticationProvider } from '../providers/github-authentication.provider';
import type { IGithubOAuthClient } from '../providers/i-github-oauth-client';
import {
  AccountLinkRequiredError,
  AuthenticationMethod,
  OAuthEmailRequiredError,
} from '../authentication-provider';
import { AuthIdentity } from '../../aggregates/auth-identity';
import { OAuthProvider } from '../../value-objects';
import type { IAuthIdentityRepository } from '../../repositories/i-auth-identity.repository';
import type { ExecutionContext } from '@dailyuse/contracts/shared';

const createMockIdentityRepo = (
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

const createMockOAuthClient = (subjectId = '12345'): IGithubOAuthClient => ({
  exchangeCodeForIdentity: vi.fn().mockResolvedValue({
    subjectId,
    username: 'octocat',
    email: 'octocat@example.com',
  }),
});

const context = { deviceId: 'device-1', cx: {} as ExecutionContext };

describe('GithubAuthenticationProvider', () => {
  let repo: IAuthIdentityRepository;
  let oauthClient: IGithubOAuthClient;

  beforeEach(() => {
    repo = createMockIdentityRepo();
    oauthClient = createMockOAuthClient();
  });

  it('exposes the github method id', () => {
    const provider = new GithubAuthenticationProvider(oauthClient, repo);
    expect(provider.method).toBe(AuthenticationMethod.Github);
  });

  it('resolves an existing identity bound to the GitHub subject', async () => {
    const existing = AuthIdentity.createWithOAuth({
      provider: OAuthProvider.Github,
      sub: '12345',
    });
    repo = createMockIdentityRepo({
      findByOAuth: vi.fn().mockResolvedValue(existing),
    });

    const provider = new GithubAuthenticationProvider(oauthClient, repo);
    const result = await provider.authenticate({ code: 'auth-code' }, context);

    expect(result.identity).toBe(existing);
    expect(result.isNewIdentity).toBe(false);
    expect(repo.findByOAuth).toHaveBeenCalledWith(OAuthProvider.Github, '12345');
    // No new identity persisted for an existing binding.
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('provisions a new identity on first-time GitHub login', async () => {
    const provider = new GithubAuthenticationProvider(oauthClient, repo);
    const result = await provider.authenticate({ code: 'auth-code' }, context);

    expect(result.isNewIdentity).toBe(true);
    expect(result.identity.hasOAuth()).toBe(true);
    expect(result.identity.identifiers).toHaveLength(1);
    expect(result.identity.identifiers[0]?.isVerified).toBe(true);
    expect(repo.findByEmail).toHaveBeenCalledWith('octocat@example.com');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('requires explicit linking when the provider email belongs to another identity', async () => {
    const existing = AuthIdentity.createWithOAuth({
      provider: OAuthProvider.Google,
      sub: 'existing-google-subject',
      verifiedEmail: 'octocat@example.com',
    });
    repo = createMockIdentityRepo({
      findByEmail: vi.fn().mockResolvedValue(existing),
    });
    const provider = new GithubAuthenticationProvider(oauthClient, repo);

    await expect(provider.authenticate({ code: 'auth-code' }, context)).rejects.toBeInstanceOf(
      AccountLinkRequiredError,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('does not create an orphan identity when GitHub has no verified email', async () => {
    oauthClient = {
      exchangeCodeForIdentity: vi.fn().mockResolvedValue({
        subjectId: 'no-email',
        username: 'private-email-user',
        email: null,
      }),
    };
    const provider = new GithubAuthenticationProvider(oauthClient, repo);

    await expect(provider.authenticate({ code: 'auth-code' }, context)).rejects.toBeInstanceOf(
      OAuthEmailRequiredError,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('keys the lookup by the stable numeric subject id, not the username', async () => {
    oauthClient = createMockOAuthClient('99999');
    const provider = new GithubAuthenticationProvider(oauthClient, repo);

    await provider.authenticate({ code: 'auth-code' }, context);

    expect(repo.findByOAuth).toHaveBeenCalledWith(OAuthProvider.Github, '99999');
  });

  it('propagates errors from the OAuth code exchange', async () => {
    oauthClient = {
      exchangeCodeForIdentity: vi.fn().mockRejectedValue(new Error('bad code')),
    };
    const provider = new GithubAuthenticationProvider(oauthClient, repo);

    await expect(provider.authenticate({ code: 'invalid' }, context)).rejects.toThrow('bad code');
    expect(repo.save).not.toHaveBeenCalled();
  });
});
