/**
 * Login Service
 *
 * 用户登录应用服务
 */

import type { IAuthIdentityRepository, IAuthSessionRepository } from '../../domain-server';
import { LoginService as DomainLoginService, AuthSession } from '../../domain-server';
import type { LoginByEmailReq, LoginByEmailRes } from '@dailyuse/contracts/authentication';
import type { Context } from '@dailyuse/contracts/shared';
import type { IPasswordHasher } from '../../domain-shared';
import type { ITokenProvider } from '../../domain-server/services/token-provider.interface';
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
   * 执行登录
   */
  async execute(input: LoginByEmailReq, cx: Context): Promise<LoginByEmailRes> {
    logger.info('[Login] Starting login', { email: input.email });

    try {
      // 1. 通过领域服务验证凭据（内部处理失败尝试计数）
      const identity = await this.domainLoginService.loginByEmail({
        email: input.email,
        password: input.password
      });

      // 2. 创建会话（领域事件在内部创建�?
      const { AuthSession: session, tokens } = AuthSession.start({
        identityId: identity.id,
        deviceId: cx.deviceId,
        tokenProvider: this.tokenProvider
      });

      // 3. 保存会话（仓储层自动发送领域事件）
      await this.sessionRepository.save(session);

      logger.info('[Login] Login successful', {
        identityId: identity.id,
        sessionId: session.id
      });

      // 4. 返回 AuthResponse
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        identity: identity.toClientDTO(),
        session: session.toClientDTO(true)
      };
    } catch (error) {
      logger.error('[Login] Login failed', {
        email: input.email,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
