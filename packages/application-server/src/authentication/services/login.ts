/**
 * Login Service
 *
 * 用户登录应用服务
 */

import type { IAuthCredentialRepository, IAuthSessionRepository } from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService, AuthSession, DeviceInfo } from '@dailyuse/domain-server/authentication';
import type { LoginRequest, AuthTokens } from '@dailyuse/contracts/authentication';
import { eventBus } from '@dailyuse/utils';
import { AuthContainer } from '@dailyuse/infrastructure-server';

/**
 * Login Service
 */
export class Login {
  private static instance: Login;
  private readonly domainService: AuthenticationDomainService;

  private constructor(
    private readonly credentialRepository: IAuthCredentialRepository,
    private readonly sessionRepository: IAuthSessionRepository,
  ) {
    this.domainService = new AuthenticationDomainService();
  }

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(
    credentialRepository?: IAuthCredentialRepository,
    sessionRepository?: IAuthSessionRepository,
  ): Login {
    const container = AuthContainer.getInstance();
    const credRepo = credentialRepository || container.getCredentialRepository();
    const sessRepo = sessionRepository || container.getSessionRepository();
    Login.instance = new Login(credRepo, sessRepo);
    return Login.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): Login {
    if (!Login.instance) {
      Login.instance = Login.createInstance();
    }
    return Login.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    Login.instance = undefined as unknown as Login;
  }

  /**
   * 执行登录
   */
  async execute(input: LoginRequest): Promise<{ tokens: AuthTokens; user: { uuid: string; identifier: string }; requiresTwoFactor?: boolean }> {
    // 1. 验证输入
    this.validateInput(input);

    // 2. 查找凭证 (by identifier - email or username)
    const credential = await this.credentialRepository.findByAccountUuid(input.identifier);
    if (!credential) {
      throw new Error('Invalid credentials');
    }

    // 3. 验证密码（假设密码已在外部哈希）
    const isValid = this.domainService.verifyPassword(credential, input.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // 4. 创建设备信息
    const deviceType = (input.deviceInfo?.deviceType || 'UNKNOWN') as 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';
    const device = DeviceInfo.create({
      deviceType,
      os: input.deviceInfo?.os,
      browser: input.deviceInfo?.browser,
      ipAddress: input.deviceInfo?.ipAddress,
    });

    // 5. 生成 token (简化版本 - 实际应使用 JWT)
    const accessToken = this.generateToken('access');
    const refreshToken = this.generateToken('refresh');

    // 6. 创建会话
    const session = this.domainService.createSession({
      accountUuid: credential.accountUuid,
      accessToken,
      refreshToken,
      device,
      ipAddress: input.deviceInfo?.ipAddress || 'unknown',
    });

    // 7. 保存会话
    await this.sessionRepository.save(session);

    // 8. 发布领域事件
    await this.publishEvents(session);

    return {
      tokens: {
        accessToken,
        refreshToken,
      },
      user: {
        uuid: credential.accountUuid,
        identifier: input.identifier,
      },
    };
  }

  private validateInput(input: LoginRequest): void {
    if (!input.identifier?.trim()) {
      throw new Error('Identifier is required');
    }
    if (!input.password) {
      throw new Error('Password is required');
    }
  }

  private generateToken(type: 'access' | 'refresh'): string {
    // 简化的 token 生成 - 实际应使用 JWT
    return `${type}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async publishEvents(session: AuthSession): Promise<void> {
    const events = session.getUncommittedDomainEvents();
    for (const event of events) {
      await eventBus.emit(event.eventType, event);
    }
  }
}
