/**
 * Create API Key Service
 *
 * 创建 API Key 应用服务
 */

import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import type { CreateApiKeyRequest, CreateApiKeyResponse } from '@dailyuse/contracts/authentication';
import { eventBus } from '@dailyuse/utils';

/**
 * Create API Key Service
 */
export class CreateApiKey {
  private readonly domainService: AuthenticationDomainService;

  constructor(private readonly credentialRepository: IAuthCredentialRepository) {
    this.domainService = new AuthenticationDomainService();
  }

  /**
   * 执行创建 API Key
   */
  async execute(accountUuid: string, input: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    // 1. 验证输入
    if (!input.name?.trim()) {
      throw new Error('API key name is required');
    }

    // 2. 查找凭证
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    // 3. 创建 API Key（使用 AuthCredential 的方法）
    const expiresInDays = input.expiresAt ? Math.ceil((input.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)) : undefined;
    const apiKeyCredential = credential.generateApiKey(input.name, expiresInDays);

    // 4. 保存凭证
    await this.credentialRepository.save(credential);

    // 5. 发布事件
    await eventBus.emit('ApiKeyCreated', {
      accountUuid,
      keyId: apiKeyCredential.uuid,
      name: input.name,
    });

    return {
      id: apiKeyCredential.uuid,
      key: apiKeyCredential.keyPrefix + '...',  // 只返回前缀，实际 key 在生成时已返回
      name: input.name,
      createdAt: Date.now(),
      expiresAt: input.expiresAt,
    };
  }
}
