/**
 * Register Service
 *
 * 用户注册应用服务
 */

import type { IAuthIdentityRepository, IAuthSessionRepository } from '@/domain-server';
import { RegistrationService as DomainRegistrationService, AuthSession } from '@/domain-server';
import type { IPasswordHasher } from '@/domain-shared';
import type { RegisterByEmailReq, RegisterByEmailRes } from '@dailyuse/contracts/authentication';
import type { Context } from '@dailyuse/contracts/shared';
import type { ITokenProvider } from '@/domain-server/services/token-provider.interface';
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
   * 执行注册
   */
  async execute(input: RegisterByEmailReq, cx: Context): Promise<AuthResponseDTO> {
    // 1. 通过 RegistrationService 创建 AuthIdentity（含密码哈希和唯一性检查）
    const identity = await this.domainRegistrationService.registerByEmail({
      email: input.email,
      password: input.password,
    });

    // 2. 创建会话（领域事件在内部创建�?
    const { AuthSession: session, tokens } = AuthSession.start({
      identityId: identity.id,
      deviceId: cx.deviceId,
      tokenProvider: this.tokenProvider,
    });

    // 3. 保存会话（仓储层自动发送领域事件）
    await this.sessionRepository.save(session);

    const sessionDto = session.toClientDTO(true);

    // 4. 返回 AuthResponse
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      identity: identity.toClientDTO(),
      session: sessionDto,
    };
  }
}
