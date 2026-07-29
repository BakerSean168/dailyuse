/**
 * Register Use Case
 *
 * Application use case for user registration.
 * On success, best-effort sends an EmailVerify challenge (failure does not block registration).
 */

import type { Result } from '@memoflow/contracts/result';
import { ok, fail } from '@memoflow/contracts/result';
import {
  AuthSession,
  RegistrationService as DomainRegistrationService,
  VerificationChallengePurpose,
  type IAuthIdentityRepository,
  type IAuthSessionRepository,
  type IEmailSender,
  type ITokenProvider,
  type IVerificationChallengeStore,
} from '../../../domain';
import type { IPasswordHasher } from '../../../domain';
import type { RegisterByEmailReq, AuthResponseDTO } from '@memoflow/contracts/authentication';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import { UserAlreadyExistsError } from '../../../domain/services/registration';
import { createLogger } from '@memoflow/utils/logger';
// Residual 949: maskEmail dual retired — sole server shared mask-email helper.
import { maskEmail } from '../../../shared/mask-email';

const logger = createLogger('Register');

/**
 * Register Use Case
 */
export class RegisterUseCase {
  private readonly domainRegistrationService: DomainRegistrationService;

  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly sessionRepository: IAuthSessionRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenProvider: ITokenProvider,
    private readonly challengeStore?: IVerificationChallengeStore,
    private readonly emailSender?: IEmailSender,
  ) {
    this.domainRegistrationService = new DomainRegistrationService(
      identityRepository,
      passwordHasher,
    );
  }

  /**
   * Execute registration flow.
   */
  async execute(input: RegisterByEmailReq, cx: ExecutionContext, deviceId: string): Promise<Result<AuthResponseDTO>> {
    try {
      // 1. Create AuthIdentity via RegistrationService (handles password hashing and uniqueness check)
      const identity = await this.domainRegistrationService.registerByEmail({
        email: input.email,
        password: input.password,
      });

      // 2. Create session (domain events created internally)
      const { AuthSession: session, tokens } = AuthSession.start({
        identityId: identity.id,
        deviceId,
        tokenProvider: this.tokenProvider,
        device: cx.device,
      });

      // 3. Save session (repository dispatches domain events automatically)
      await this.sessionRepository.save(session);

      // 4. Best-effort EmailVerify code (do not fail registration if send fails)
      if (this.challengeStore && this.emailSender) {
        try {
          const code = await this.challengeStore.issue({
            purpose: VerificationChallengePurpose.EmailVerify,
            subject: input.email,
            identityId: String(identity.id),
          });
          await this.emailSender.sendEmailVerificationCode(input.email, code);
        } catch (sendErr) {
          logger.warn('[Register] Failed to send email verification code after register', {
            email: maskEmail(input.email),
            error: sendErr instanceof Error ? sendErr.message : String(sendErr),
          });
        }
      }

      const sessionDto = session.toClientDTO(true);

      // 5. Return AuthResponse
      return ok({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        identity: identity.toClientDTO(),
        session: sessionDto,
      });
    } catch (err) {
      if (err instanceof UserAlreadyExistsError) {
        return fail({
          code: 'CONFLICT',
          message: err.message,
          context: {
            ...(err.context ?? {}),
            domainCode:
              typeof err.context?.domainCode === 'string'
                ? err.context.domainCode
                : err.code,
          },
        });
      }
      throw err;
    }
  }
}
