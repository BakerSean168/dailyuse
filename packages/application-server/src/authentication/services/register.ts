/**
 * Register Service
 *
 * 用户注册应用服务
 */

import type {
  IAuthCredentialRepository,
  IAuthSessionRepository,
} from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService, DeviceInfo } from '@dailyuse/domain-server/authentication';
import type { RegisterRequest, AuthTokens } from '@dailyuse/contracts/authentication';
import { eventBus } from '@dailyuse/utils';

/**
 * Register Service
 */
export class Register {
  private readonly domainService: AuthenticationDomainService;

  constructor(
    private readonly credentialRepository: IAuthCredentialRepository,
    private readonly sessionRepository: IAuthSessionRepository,
  ) {
    this.domainService = new AuthenticationDomainService();
  }

  /**
   * 执行注册
   */
  async execute(
    input: RegisterRequest & { hashedPassword?: string },
  ): Promise<{ tokens: AuthTokens; user: { uuid: string; email: string; username: string } }> {
    // 1. 验证输入
    this.validateInput(input);

    // 2. 验证密码强度
    const passwordStrength = this.domainService.validatePasswordStrength(input.password);
    if (!passwordStrength.isValid) {
      throw new Error(passwordStrength.errors.join(', '));
    }

    // 3. 检查邮箱是否已存在（这里使用 email 作为账户标识符）
    const existingCredential = await this.credentialRepository.findByAccountUuid(input.email);
    if (existingCredential) {
      throw new Error('Email already registered');
    }

    // 4. 创建凭证（需要外部先对密码进行哈希）
    const hashedPassword = input.hashedPassword || this.simpleHash(input.password);
    const credential = this.domainService.createPasswordCredential({
      accountUuid: input.email, // 暂时使用 email 作为 accountUuid
      hashedPassword,
    });

    // 5. 保存凭证
    await this.credentialRepository.save(credential);

    // 6. 创建设备信息
    const deviceType = (input.deviceInfo?.deviceType || 'UNKNOWN') as
      | 'BROWSER'
      | 'DESKTOP'
      | 'MOBILE'
      | 'TABLET'
      | 'API'
      | 'UNKNOWN';
    const device = DeviceInfo.create({
      deviceType,
      os: input.deviceInfo?.os,
      browser: input.deviceInfo?.browser,
      ipAddress: input.deviceInfo?.ipAddress,
    });

    // 7. 生成 token
    const accessToken = this.generateToken('access');
    const refreshToken = this.generateToken('refresh');

    // 8. 创建会话
    const session = this.domainService.createSession({
      accountUuid: credential.accountUuid,
      accessToken,
      refreshToken,
      device,
      ipAddress: input.deviceInfo?.ipAddress || 'unknown',
    });

    // 9. 保存会话
    await this.sessionRepository.save(session);

    // 10. 发布领域事件
    await this.publishEvents(credential, session);

    return {
      tokens: {
        accessToken,
        refreshToken,
      },
      user: {
        uuid: credential.accountUuid,
        email: input.email,
        username: input.username,
      },
    };
  }

  private validateInput(input: RegisterRequest): void {
    if (!input.email?.trim()) {
      throw new Error('Email is required');
    }
    if (!input.username?.trim()) {
      throw new Error('Username is required');
    }
    if (!input.password) {
      throw new Error('Password is required');
    }
    if (input.password !== input.confirmPassword) {
      throw new Error('Passwords do not match');
    }
  }

  private simpleHash(password: string): string {
    // 简化的哈希 - 实际应使用 bcrypt/argon2
    return `hashed_${password}_${Date.now()}`;
  }

  private generateToken(type: 'access' | 'refresh'): string {
    // 简化的 token 生成 - 实际应使用 JWT
    return `${type}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async publishEvents(credential: any, session: any): Promise<void> {
    const credentialEvents = credential.getUncommittedDomainEvents?.() || [];
    for (const event of credentialEvents) {
      await eventBus.emit(event.eventType, event);
    }

    const sessionEvents = session.getUncommittedDomainEvents?.() || [];
    for (const event of sessionEvents) {
      await eventBus.emit(event.eventType, event);
    }
  }
}
