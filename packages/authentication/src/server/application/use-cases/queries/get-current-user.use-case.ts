import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { GetCurrentUserRes } from '@dailyuse/contracts/authentication';
import { AuthIdentityStatus } from '@dailyuse/contracts/authentication';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import {
  type IAuthIdentityRepository,
  type IAuthSessionRepository,
} from '../../../domain';
import { AuthSessionId } from '../../../domain';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] ?? '*'}***@${domain}`;
  return `${local[0]}***${local.slice(-1)}@${domain}`;
}

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
      const currentSession = await this.sessionRepository.findById(AuthSessionId.of(sessionId));
      if (currentSession && String(currentSession.identityId) === String(identity.id)) {
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
