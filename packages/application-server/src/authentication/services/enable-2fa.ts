/**
 * Enable 2FA Service
 *
 * 启用两步验证应用服务
 */

import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import type { Enable2FARequest, Enable2FAResponse } from '@dailyuse/contracts/authentication';

/**
 * Enable 2FA Service
 */
export class Enable2FA {
  private readonly domainService: AuthenticationDomainService;

  constructor(private readonly credentialRepository: IAuthCredentialRepository) {
    this.domainService = new AuthenticationDomainService();
  }

  /**
   * 执行启用 2FA
   */
  async execute(accountUuid: string, _input?: Enable2FARequest): Promise<Enable2FAResponse> {
    // 1. 查找凭证
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    // 2. 检查是否已启用
    if (credential.twoFactor?.enabled) {
      throw new Error('2FA is already enabled');
    }

    // 3. 生成 2FA 密钥（使用 TOTP 方法）
    const secret = credential.enableTwoFactor('TOTP');
    const backupCodes = credential.twoFactor?.backupCodes ?? [];

    // 4. 生成 QR Code URL (placeholder - 实际应使用 otpauth URL)
    const qrCode = this.generateQRCodeUrl(accountUuid, secret);

    // 5. 保存凭证
    await this.credentialRepository.save(credential);

    return {
      secret,
      qrCodeUrl: qrCode,
      backupCodes,
    };
  }

  /**
   * 生成 QR Code URL (placeholder)
   */
  private generateQRCodeUrl(accountUuid: string, secret: string): string {
    // TODO: 生成真正的 otpauth URL
    return `otpauth://totp/DailyUse:${accountUuid}?secret=${secret}&issuer=DailyUse`;
  }
}
