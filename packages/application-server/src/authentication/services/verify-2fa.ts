/**
 * Verify 2FA Service
 *
 * 验证两步验证码应用服务
 */

import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import type { Verify2FARequest } from '@dailyuse/contracts/authentication';
import { eventBus } from '@dailyuse/utils';
import { AuthContainer } from '@dailyuse/infrastructure-server';

/**
 * Verify 2FA Service
 */
export class Verify2FA {
  private static instance: Verify2FA;
  private readonly domainService: AuthenticationDomainService;

  private constructor(private readonly credentialRepository: IAuthCredentialRepository) {
    this.domainService = new AuthenticationDomainService();
  }

  /**
   * 创建服务实例
   */
  static createInstance(credentialRepository?: IAuthCredentialRepository): Verify2FA {
    const container = AuthContainer.getInstance();
    const repo = credentialRepository || container.getCredentialRepository();
    Verify2FA.instance = new Verify2FA(repo);
    return Verify2FA.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): Verify2FA {
    if (!Verify2FA.instance) {
      Verify2FA.instance = Verify2FA.createInstance();
    }
    return Verify2FA.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    Verify2FA.instance = undefined as unknown as Verify2FA;
  }

  /**
   * 执行 2FA 验证
   */
  async execute(accountUuid: string, input: Verify2FARequest): Promise<void> {
    // 1. 验证输入
    if (!input.code?.trim()) {
      throw new Error('2FA code is required');
    }

    // 2. 查找凭证
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    // 3. 检查是否已启用 2FA
    if (!credential.twoFactor?.enabled) {
      throw new Error('2FA is not enabled for this account');
    }

    // 4. 验证 2FA 码
    const isValid = this.domainService.verifyTwoFactorCode(credential, input.code);
    if (!isValid) {
      // 尝试使用备份码
      const backupCodeValid = credential.useBackupCode(input.code);
      if (!backupCodeValid) {
        throw new Error('Invalid 2FA code');
      }
      // 备份码使用成功，保存凭证
      await this.credentialRepository.save(credential);
    }

    // 5. 发布事件
    await eventBus.emit('TwoFactorVerified', {
      accountUuid: credential.accountUuid,
    });
  }
}
