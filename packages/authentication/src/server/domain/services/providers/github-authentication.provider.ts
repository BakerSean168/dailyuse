/**
 * GitHub Authentication Provider — GitHub 认证提供者
 *
 * The second pluggable login method (ADR-034). It authenticates a user via a
 * GitHub authorization code, resolving a stable GitHub subject id, then
 * find-or-creates the owning Daily Use identity.
 *
 * 第二个可插拔登录方式（ADR-034）。通过 GitHub 授权码认证用户，解析稳定的
 * GitHub subject id，再查找或创建对应的 Daily Use 身份。
 *
 * Boundaries enforced here:
 * - GitHub login is identity-only; it does NOT create or authorize a knowledge
 *   repository. Repository connection is a separate KnowledgeRepositoryConnection flow.
 * - The stable key is the GitHub numeric user id (subjectId), not the username.
 *
 * 此处坚守的边界：
 * - GitHub 登录只做身份认证，不创建或授权知识仓库；仓库连接是独立流程。
 * - 稳定主键是 GitHub 数字 user id（subjectId），不是用户名。
 */

import type {
  AuthenticationContext,
  AuthenticationProvider,
  AuthenticationResult,
} from '../authentication-provider';
import {
  AccountLinkRequiredError,
  AuthenticationMethod,
  OAuthEmailRequiredError,
} from '../authentication-provider';
import type { IGithubOAuthClient } from './i-github-oauth-client';
import type { IAuthIdentityRepository } from '../../repositories/i-auth-identity.repository';
import { AuthIdentity } from '../../aggregates/auth-identity';
import { OAuthProvider } from '../../value-objects';

/** Credentials accepted by the GitHub provider (an OAuth callback payload). */
export interface GithubCredentials {
  readonly code: string;
  readonly state?: string;
  readonly redirectUri?: string;
  readonly codeVerifier?: string;
}

export class GithubAuthenticationProvider implements AuthenticationProvider<GithubCredentials> {
  readonly method = AuthenticationMethod.Github;

  constructor(
    private readonly oauthClient: IGithubOAuthClient,
    private readonly identityRepository: IAuthIdentityRepository,
  ) {}

  async authenticate(
    credentials: GithubCredentials,
    _context: AuthenticationContext,
  ): Promise<AuthenticationResult> {
    // 1. Exchange the code for a stable GitHub subject id (identity only).
    const githubUser = await this.oauthClient.exchangeCodeForIdentity({
      code: credentials.code,
      state: credentials.state,
      redirectUri: credentials.redirectUri,
      codeVerifier: credentials.codeVerifier,
    });

    // 2. Find the identity already bound to this GitHub subject.
    const existing = await this.identityRepository.findByOAuth(
      OAuthProvider.Github,
      githubUser.subjectId,
    );
    if (existing) {
      return { identity: existing, isNewIdentity: false };
    }

    const verifiedEmail = githubUser.email?.trim().toLowerCase();
    if (!verifiedEmail) {
      throw new OAuthEmailRequiredError(AuthenticationMethod.Github);
    }
    const identityWithEmail = await this.identityRepository.findByEmail(verifiedEmail);
    if (identityWithEmail) {
      throw new AccountLinkRequiredError(AuthenticationMethod.Github, verifiedEmail);
    }

    // 3. First-time GitHub login provisions a new Daily Use identity.
    //    No repository access is requested or granted here.
    const identity = AuthIdentity.createWithOAuth({
      provider: OAuthProvider.Github,
      sub: githubUser.subjectId,
      verifiedEmail,
    });
    identity.activate();
    await this.identityRepository.save(identity);

    return { identity, isNewIdentity: true };
  }
}
