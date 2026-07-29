import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { GetCurrentUserRes } from '@memoflow/contracts/authentication';
import { AuthIdentityStatus } from '@memoflow/contracts/authentication';
import { IdentityId } from '@memoflow/domain-shared/shared';
import {
  type IAuthIdentityRepository,
  type IAuthSessionRepository,
} from '../../../domain';
import { AuthSessionId } from '../../../domain';
// Residual 949: maskEmail dual retired — sole server shared mask-email helper.
// Invalid-email policy unified to non-leaking '***' (was: return raw email).
import { maskEmail } from '../../../shared/mask-email';

export class GetCurrentUserUseCase {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly sessionRepository: IAuthSessionRepository,
  ) {}

  async execute(cx: ExecutionContext, sessionId?: string): Promise<Result<GetCurrentUserRes>> {
    const identity = await this.identityRepository.findById(IdentityId.of(cx.identityId));
    if (!identity) {
      return error('NOT_FOUND', 'Identity not found');
    }

    let session = null;
    if (sessionId) {
      const currentSession = await this.sessionRepository.findByIdForIdentity(
        IdentityId.of(cx.identityId),
        AuthSessionId.of(sessionId),
      );
      if (currentSession) {
        session = currentSession.toClientDTO(true);
      }
    }

    const identityDto = identity.toClientDTO();
    const primaryEmail = identityDto.identifiers.find((i) => i.type === 'Email');
    const emailVerified = primaryEmail?.isVerified === true;
    const requiresVerification =
      identityDto.status === AuthIdentityStatus.Unverified ||
      (Boolean(primaryEmail) && !emailVerified);

    return ok({
      identity: identityDto,
      session,
      emailVerification: {
        required: requiresVerification,
        emailMasked: primaryEmail ? maskEmail(primaryEmail.value) : undefined,
      },
    });
  }
}
