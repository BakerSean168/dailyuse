/**
 * Verify 2FA Service
 *
 * 验证两步验证码应用服务
 */

import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import type { Verify2FARequest } from '@dailyuse/contracts/authentication';
import { eventBus } from '@dailyuse/utils';

/**
 * Verify 2FA Service
 */
export class Verify2FA {
  private readonly domainService: AuthenticationDomainService;

  constructor(private readonly credentialRepository: IAuthCredentialRepository) {
    this.domainService = new AuthenticationDomainService();
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
