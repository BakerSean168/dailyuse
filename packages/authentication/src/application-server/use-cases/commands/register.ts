/**
 * Register Service
 *
 * Application service for user registration.
 */

import {
  AuthSession,
  RegistrationService as DomainRegistrationService,
  type IAuthIdentityRepository,
  type IAuthSessionRepository,
  type ITokenProvider,
} from '../../../domain-server';
import type { IPasswordHasher } from '../../../domain-shared';
import type { RegisterByEmailReq, RegisterByEmailRes } from '@dailyuse/contracts/authentication';
import type { Context } from '@dailyuse/contracts/shared';
import type { AuthResponseDTO } from '@dailyuse/contracts/authentication';

/**
 * Register Service
 */
export class Register {
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
  async execute(input: RegisterByEmailReq, cx: Context): Promise<AuthResponseDTO> {
    // 1. Create AuthIdentity via RegistrationService (handles password hashing and uniqueness check)
    const identity = await this.domainRegistrationService.registerByEmail({
      email: input.email,
      password: input.password,
    });

    // 2. Create session (domain events created internally)
    const { AuthSession: session, tokens } = AuthSession.start({
      identityId: identity.id,
      deviceId: cx.deviceId,
      tokenProvider: this.tokenProvider,
    });

    // 3. Save session (repository dispatches domain events automatically)
    await this.sessionRepository.save(session);

    const sessionDto = session.toClientDTO(true);

    // 4. Return AuthResponse
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      identity: identity.toClientDTO(),
      session: sessionDto,
    };
  }
}
