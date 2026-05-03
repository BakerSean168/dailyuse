/**
 * Register Use Case
 *
 * Application use case for user registration.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import {
  AuthSession,
  RegistrationService as DomainRegistrationService,
  type IAuthIdentityRepository,
  type IAuthSessionRepository,
  type ITokenProvider,
} from '../../../domain-server';
import type { IPasswordHasher } from '../../../domain-shared';
import type { RegisterByEmailReq, AuthResponseDTO } from '@dailyuse/contracts/authentication';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import { UserAlreadyExistsError } from '../../../domain-server/services/registration';

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
      });

      // 3. Save session (repository dispatches domain events automatically)
      await this.sessionRepository.save(session);

      const sessionDto = session.toClientDTO(true);

      // 4. Return AuthResponse
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
            ...((err as any).context ?? {}),
            domainCode:
              typeof (err as any).context?.domainCode === 'string'
                ? (err as any).context.domainCode
                : (err as any).code,
          },
        });
      }
      throw err;
    }
  }
}
