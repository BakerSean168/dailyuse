/**
 * Change Password Service
 *
 * 修改密码应用服务
 */

import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import type { ChangePasswordRequest } from '@dailyuse/contracts/authentication';
import { eventBus } from '@dailyuse/utils';
import { AuthContainer } from '@dailyuse/infrastructure-server';

/**
 * Change Password Service
 */
export class ChangePassword {
  private static instance: ChangePassword;
  private readonly domainService: AuthenticationDomainService;

  private constructor(private readonly credentialRepository: IAuthCredentialRepository) {
    this.domainService = new AuthenticationDomainService();
  }

  /**
   * 创建服务实例
   */
  static createInstance(credentialRepository?: IAuthCredentialRepository): ChangePassword {
    const container = AuthContainer.getInstance();
    const repo = credentialRepository || container.getCredentialRepository();
    ChangePassword.instance = new ChangePassword(repo);
    return ChangePassword.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ChangePassword {
    if (!ChangePassword.instance) {
      ChangePassword.instance = ChangePassword.createInstance();
    }
    return ChangePassword.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ChangePassword.instance = undefined as unknown as ChangePassword;
  }

  /**
   * 执行密码修改
   */
  async execute(accountUuid: string, input: ChangePasswordRequest): Promise<void> {
    // 1. 验证输入
    this.validateInput(input);

    // 2. 查找凭证
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    // 3. 验证旧密码（使用哈希后的密码）
    const hashedOldPassword = this.hashPassword(input.oldPassword);
    const isValid = this.domainService.verifyPassword(credential, hashedOldPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // 4. 验证密码强度
    const strengthResult = this.domainService.validatePasswordStrength(input.newPassword);
    if (!strengthResult.isValid) {
      throw new Error(strengthResult.errors.join(', '));
    }

    // 5. 哈希新密码并更新
    const hashedNewPassword = this.hashPassword(input.newPassword);
    credential.setPassword(hashedNewPassword);

    // 6. 保存凭证
    await this.credentialRepository.save(credential);

    // 7. 发布领域事件
    const events = credential.getUncommittedDomainEvents();
    for (const event of events) {
      await eventBus.emit(event.eventType, event);
    }
  }

  /**
   * 密码哈希 (placeholder - 实际实现应使用 bcrypt 或 argon2)
   */
  private hashPassword(password: string): string {
    // TODO: 使用安全的密码哈希算法
    return password;
  }

  private validateInput(input: ChangePasswordRequest): void {
    if (!input.oldPassword) {
      throw new Error('Current password is required');
    }
    if (!input.newPassword) {
      throw new Error('New password is required');
    }
    if (!input.confirmPassword) {
      throw new Error('Confirm password is required');
    }
    if (input.newPassword !== input.confirmPassword) {
      throw new Error('Password confirmation does not match');
    }
    if (input.newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (input.newPassword === input.oldPassword) {
      throw new Error('New password must be different from current password');
    }
  }
}
