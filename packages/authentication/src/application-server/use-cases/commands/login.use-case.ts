/**
 * Login Use Case
 *
 * Application use case for user login.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import {
  AuthSession,
  LoginService as DomainLoginService,
  type IAuthIdentityRepository,
  type IAuthSessionRepository,
  type ITokenProvider,
} from '../../../domain-server';
import type { LoginByEmailReq, LoginByEmailRes } from '@dailyuse/contracts/authentication';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IPasswordHasher } from '../../../domain-shared';
import { UserNotFoundError, InvalidPasswordError } from '../../../domain-server/services/login';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('Login');

/**
 * Login Use Case
 */
export class LoginUseCase {
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
  async execute(input: LoginByEmailReq, cx: ExecutionContext, deviceId: string): Promise<Result<LoginByEmailRes>> {
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
        deviceId,
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
      return ok({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        identity: identity.toClientDTO(),
        session: sessionDto,
      });
    } catch (err) {
      // Security: don't distinguish "user not found" vs "wrong password"
      if (err instanceof UserNotFoundError || err instanceof InvalidPasswordError) {
        return error('UNAUTHORIZED', 'Invalid email or password');
      }

      logger.error('[Login] Login failed', {
        email: input.email,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}
