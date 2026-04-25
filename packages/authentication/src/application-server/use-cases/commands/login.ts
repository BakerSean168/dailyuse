/**
 * Login Service
 *
 * Application service for user login.
 */

import {
  AuthSession,
  LoginService as DomainLoginService,
  type IAuthIdentityRepository,
  type IAuthSessionRepository,
  type ITokenProvider,
} from '../../../domain-server';
import type { LoginByEmailReq, LoginByEmailRes } from '@dailyuse/contracts/authentication';
import type { Context } from '@dailyuse/contracts/shared';
import type { IPasswordHasher } from '../../../domain-shared';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('Login');

/**
 * Login Service
 */
export class Login {
  private readonly domainLoginService: DomainLoginService;

  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly sessionRepository: IAuthSessionRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenProvider: ITokenProvider,
  ) {
    this.domainLoginService = new DomainLoginService(identityRepository, passwordHasher);
  }

  /**
   * Execute login flow.
   */
  async execute(input: LoginByEmailReq, cx: Context): Promise<LoginByEmailRes> {
    logger.info('[Login] Starting login', { email: input.email });

    try {
      // 1. Verify credentials via domain service (tracks failed attempts internally)
      const identity = await this.domainLoginService.loginByEmail({
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

      logger.info('[Login] Login successful', {
        identityId: identity.id,
        sessionId: session.id,
      });

      const sessionDto = session.toClientDTO(true);

      // 4. Return AuthResponse
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        identity: identity.toClientDTO(),
        session: sessionDto,
      };
    } catch (error) {
      logger.error('[Login] Login failed', {
        email: input.email,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
