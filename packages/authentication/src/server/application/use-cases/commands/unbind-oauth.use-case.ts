/**
 * Unbind OAuth Use Case
 *
 * Removes a provider binding from the current identity while preserving at
 * least one login path (password or another OAuth binding).
 *
 * 从当前身份移除提供者绑定，并保证至少保留一条登录路径（密码或其它 OAuth）。
 */

import type { Result } from '@memoflow/contracts/result';
import { ok, fail } from '@memoflow/contracts/result';
import type { UnbindOAuthReq } from '@memoflow/contracts/authentication';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import { IdentityId } from '@memoflow/domain-shared/shared';
import type { IAuthIdentityRepository } from '../../../domain';
import { AuthDomainCode } from '../../../domain';
import { createLogger } from '@memoflow/utils/logger';
// Residual 991: sole toDomainProvider (local dual retired).
import { toDomainProvider } from '../../../shared/to-domain-provider';

const logger = createLogger('UnbindOAuth');

export class UnbindOAuthUseCase {
  constructor(private readonly identityRepository: IAuthIdentityRepository) {}

  async execute(input: UnbindOAuthReq, cx: ExecutionContext): Promise<Result<void>> {
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

    const binding = identity
      .getOAuthBindings()
      .find((b) => b.provider === domainProvider);
    if (!binding) {
      return fail({
        code: 'NOT_FOUND',
        message: `No ${input.provider} binding on this identity`,
      });
    }

    try {
      identity.removeOAuthBinding(binding.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('last login path')) {
        return fail({
          code: 'CONFLICT',
          message: 'Cannot remove the last login path for this identity',
          context: { domainCode: AuthDomainCode.LAST_LOGIN_PATH },
        });
      }
      throw err;
    }

    await this.identityRepository.save(identity);
    logger.info('[UnbindOAuth] Removed provider binding', {
      identityId: String(identity.id),
      provider: input.provider,
    });
    return ok(undefined);
  }
}
