/**
 * Reset Password Service
 *
 * 重置密码应用服务
 */

import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import type { ResetPasswordRequest } from '@dailyuse/contracts/authentication';
import { eventBus } from '@dailyuse/utils';

/**
 * Reset Password Service
 */
export class ResetPassword {
  private readonly domainService: AuthenticationDomainService;

  constructor(private readonly credentialRepository: IAuthCredentialRepository) {
    this.domainService = new AuthenticationDomainService();
  }

  /**
   * 执行密码重置
   */
  async execute(input: ResetPasswordRequest): Promise<void> {
    // 1. 验证输入
    this.validateInput(input);

    // 2. 验证重置令牌（placeholder - 实际应使用安全的令牌验证）
    // TODO: 实现令牌存储和验证逻辑
    const accountUuid = this.validateResetToken(input.token);
    if (!accountUuid) {
      throw new Error('Invalid or expired reset token');
    }

    // 3. 查找凭证
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Invalid or expired reset token');
    }

    // 4. 验证密码强度
    const strengthResult = this.domainService.validatePasswordStrength(input.newPassword);
    if (!strengthResult.isValid) {
      throw new Error(strengthResult.errors.join(', '));
    }

    // 5. 哈希并设置新密码
    const hashedPassword = this.hashPassword(input.newPassword);
    credential.setPassword(hashedPassword);

    // 6. 保存凭证
    await this.credentialRepository.save(credential);

    // 7. 发布领域事件
    const events = credential.getUncommittedDomainEvents();
    for (const event of events) {
      await eventBus.emit(event.eventType, event);
    }
  }

  /**
   * 验证重置令牌 (placeholder)
   */
  private validateResetToken(token: string): string | null {
    // TODO: 实现令牌验证逻辑
    // 应该从存储中查找令牌，验证是否过期，返回关联的 accountUuid
    if (!token || token.length < 10) {
      return null;
    }
    // 临时返回 null，实际实现需要从存储中获取
    return null;
  }

  /**
   * 密码哈希 (placeholder)
   */
  private hashPassword(password: string): string {
    // TODO: 使用安全的密码哈希算法
    return password;
  }

  private validateInput(input: ResetPasswordRequest): void {
    if (!input.token) {
      throw new Error('Reset token is required');
    }
    if (!input.newPassword) {
      throw new Error('New password is required');
    }
    if (input.newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
  }
}
