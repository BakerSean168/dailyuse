/**
 * Revoke API Key Service
 *
 * 撤销 API Key 应用服务
 */

import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import type { RevokeApiKeyRequest } from '@dailyuse/contracts/authentication';
import { eventBus } from '@dailyuse/utils';

/**
 * Revoke API Key Service
 */
export class RevokeApiKey {
  constructor(private readonly credentialRepository: IAuthCredentialRepository) {}

  /**
   * 执行撤销 API Key
   */
  async execute(accountUuid: string, input: RevokeApiKeyRequest): Promise<void> {
    // 1. 查找凭证
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    // 2. 撤销 API Key（使用 apiKeyId）
    credential.revokeApiKey(input.apiKeyId);

    // 3. 保存凭证
    await this.credentialRepository.save(credential);

    // 4. 发布事件
    await eventBus.emit('ApiKeyRevoked', {
      accountUuid,
      keyId: input.apiKeyId,
    });
  }
}
