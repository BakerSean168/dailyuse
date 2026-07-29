/**
 * Bind OAuth Use Case
 *
 * Links a provider identity (GitHub subject) to the currently authenticated
 * MemoFlow identity after state/PKCE validation. Never silently merges two
 * identities when the subject is already owned by someone else (ADR-036).
 *
 * 将提供者身份（GitHub subject）绑定到当前已登录的 MemoFlow 身份（state/PKCE
 * 校验之后）。若 subject 已属于其他身份，禁止静默合并（ADR-036）。
 */

import type { Result } from '@memoflow/contracts/result';
import { ok, fail } from '@memoflow/contracts/result';
import type { BindOAuthReq, BindOAuthRes } from '@memoflow/contracts/authentication';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import { IdentityId } from '@memoflow/domain-shared/shared';
import type { IAuthIdentityRepository } from '../../../domain';
import {
  AuthDomainCode,
  OAuthBinding,
  AuthCredentialId,
} from '../../../domain';
import type { IGithubOAuthClient } from '../../../domain/services/providers/i-github-oauth-client';
import type { IOAuthStateStore } from '../../../domain/services/i-oauth-state-store';
import { createLogger } from '@memoflow/utils/logger';
// Residual 991: sole toDomainProvider (local dual retired).
import { toDomainProvider } from '../../../shared/to-domain-provider';

const logger = createLogger('BindOAuth');

export class BindOAuthUseCase {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly stateStore: IOAuthStateStore,
    private readonly githubOAuthClient?: IGithubOAuthClient,
  ) {}

  async execute(input: BindOAuthReq, cx: ExecutionContext): Promise<Result<BindOAuthRes>> {
    if (input.provider !== 'Github') {
      return fail({
        code: 'SERVICE_UNAVAILABLE',
        message: `OAuth provider is not enabled: ${input.provider}`,
      });
    }
    if (!this.githubOAuthClient) {
      return fail({
        code: 'SERVICE_UNAVAILABLE',
        message: 'GitHub OAuth is not configured',
      });
    }

    const consumed = this.stateStore.consume(input.state, input.provider);
    if (!consumed) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid or expired OAuth state',
      });
    }

    const domainProvider = toDomainProvider(input.provider);
    if (!domainProvider) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: `Unsupported OAuth provider: ${input.provider}`,
      });
    }

    const identity = await this.identityRepository.findById(IdentityId.of(cx.identityId));
    if (!identity) {
      return fail({ code: 'NOT_FOUND', message: 'Identity not found' });
    }

    let githubUser;
    try {
      githubUser = await this.githubOAuthClient.exchangeCodeForIdentity({
        code: input.code,
        state: input.state,
        codeVerifier: consumed.codeVerifier,
        redirectUri: consumed.redirectUri,
      });
    } catch (err) {
      logger.error('[BindOAuth] GitHub exchange failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return fail({
        code: 'UNAUTHORIZED',
        message: 'OAuth provider authentication failed',
      });
    }

    const existingOwner = await this.identityRepository.findByOAuth(
      domainProvider,
      githubUser.subjectId,
    );
    if (existingOwner && String(existingOwner.id) !== String(identity.id)) {
      // Explicit conflict — never silent-merge (ADR-036).
      return fail({
        code: 'CONFLICT',
        message: 'This OAuth account is already linked to another MemoFlow identity',
        context: {
          domainCode: AuthDomainCode.OAUTH_ALREADY_LINKED,
          provider: input.provider,
        },
      });
    }

    if (existingOwner && String(existingOwner.id) === String(identity.id)) {
      return ok({
        provider: input.provider,
        providerSubjectId: githubUser.subjectId,
        created: false,
      });
    }

    // Identity-only binding: do not persist provider access/refresh tokens.
    const binding = OAuthBinding.create({
      id: AuthCredentialId.generate(),
      provider: domainProvider,
      providerSubjectId: githubUser.subjectId,
    });
    identity.addOAuthBinding(binding);
    await this.identityRepository.save(identity);

    logger.info('[BindOAuth] Bound provider', {
      identityId: String(identity.id),
      provider: input.provider,
      subjectId: githubUser.subjectId,
    });

    return ok({
      provider: input.provider,
      providerSubjectId: githubUser.subjectId,
      created: true,
    });
  }
}
