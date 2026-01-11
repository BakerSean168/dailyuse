/**
 * Disable 2FA Service
 *
 * 禁用两步验证应用服务
 */

import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import type { Disable2FARequest } from '@dailyuse/contracts/authentication';
import { eventBus } from '@dailyuse/utils';
import { AuthContainer } from '@dailyuse/infrastructure-server';

/**
 * Disable 2FA Service
 */
export class Disable2FA {
  private static instance: Disable2FA;
  private readonly domainService: AuthenticationDomainService;

  private constructor(private readonly credentialRepository: IAuthCredentialRepository) {
    this.domainService = new AuthenticationDomainService();
  }

  /**
   * 创建服务实例
   */
  static createInstance(credentialRepository?: IAuthCredentialRepository): Disable2FA {
    const container = AuthContainer.getInstance();
    const repo = credentialRepository || container.getCredentialRepository();
    Disable2FA.instance = new Disable2FA(repo);
    return Disable2FA.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): Disable2FA {
    if (!Disable2FA.instance) {
      Disable2FA.instance = Disable2FA.createInstance();
    }
    return Disable2FA.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    Disable2FA.instance = undefined as unknown as Disable2FA;
  }

  /**
   * 执行禁用 2FA
   */
  async execute(accountUuid: string, input: Disable2FARequest): Promise<void> {
    // 1. 验证输入
    if (!input.password) {
      throw new Error('Password is required');
    }

    // 2. 查找凭证
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    // 3. 验证密码（使用哈希后的密码）
    const hashedPassword = this.hashPassword(input.password);
    const isValid = this.domainService.verifyPassword(credential, hashedPassword);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    // 4. 禁用 2FA
    credential.disableTwoFactor();

    // 5. 保存凭证
    await this.credentialRepository.save(credential);

    // 6. 发布事件
    await eventBus.emit('TwoFactorDisabled', {
      accountUuid: credential.accountUuid,
    });
  }

  /**
   * 密码哈希 (placeholder)
   */
  private hashPassword(password: string): string {
    // TODO: 使用安全的密码哈希算法
    return password;
  }
}
