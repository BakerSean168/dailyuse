/**
 * Forgot Password Service
 *
 * 忘记密码（发送重置链接）应用服务
 */

import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import type { ForgotPasswordRequest } from '@dailyuse/contracts/authentication';
import { eventBus } from '@dailyuse/utils';
import { AuthContainer } from '@dailyuse/infrastructure-server';

/**
 * Forgot Password Service
 */
export class ForgotPassword {
  private static instance: ForgotPassword;
  private readonly domainService: AuthenticationDomainService;

  private constructor(private readonly credentialRepository: IAuthCredentialRepository) {
    this.domainService = new AuthenticationDomainService();
  }

  /**
   * 创建服务实例
   */
  static createInstance(credentialRepository?: IAuthCredentialRepository): ForgotPassword {
    const container = AuthContainer.getInstance();
    const repo = credentialRepository || container.getCredentialRepository();
    ForgotPassword.instance = new ForgotPassword(repo);
    return ForgotPassword.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ForgotPassword {
    if (!ForgotPassword.instance) {
      ForgotPassword.instance = ForgotPassword.createInstance();
    }
    return ForgotPassword.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ForgotPassword.instance = undefined as unknown as ForgotPassword;
  }

  /**
   * 执行忘记密码流程
   */
  async execute(input: ForgotPasswordRequest): Promise<void> {
    // 1. 验证输入
    if (!input.email?.trim()) {
      throw new Error('Email is required');
    }

    // 2. 查找凭证（即使不存在也不报错，防止用户枚举）
    const credential = await this.credentialRepository.findByAccountUuid(input.email);
    if (!credential) {
      // 静默返回，不暴露用户是否存在
      return;
    }

    // 3. 生成重置令牌 (placeholder - 实际应使用安全的令牌生成)
    const resetToken = this.generateResetToken();

    // 4. 发布密码重置请求事件（用于发送邮件）
    await eventBus.emit('PasswordResetRequested', {
      accountUuid: credential.accountUuid,
      email: input.email,
      resetToken,
      expiresAt: Date.now() + 3600000, // 1 hour
    });
  }

  /**
   * 生成重置令牌 (placeholder)
   */
  private generateResetToken(): string {
    // TODO: 使用安全的令牌生成算法
    return `reset_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}
