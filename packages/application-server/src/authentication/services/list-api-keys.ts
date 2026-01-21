/**
 * List API Keys Service
 *
 * 获取 API Key 列表应用服务
 */

import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import type { ApiKeyCredentialClientDTO } from '@dailyuse/contracts/authentication';

/**
 * List API Keys Service
 */
export class ListApiKeys {
  constructor(private readonly credentialRepository: IAuthCredentialRepository) {}

  /**
   * 执行获取 API Key 列表
   */
  async execute(accountUuid: string): Promise<{ apiKeys: Array<{ keyId: string; name: string; lastUsedAt?: number; createdAt: number; expiresAt?: number; scopes: string[] }> }> {
    // 1. 查找凭证
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      return { apiKeys: [] };
    }

    // 2. 获取 API Keys（使用 apiKeyCredentials 属性）
    const apiKeys = credential.apiKeyCredentials;

    return {
      apiKeys: apiKeys.map(key => ({
        keyId: key.uuid,
        name: key.name,
        lastUsedAt: key.lastUsedAt ?? undefined,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt ?? undefined,
        scopes: [], // API Key 目前没有 scopes 属性
      })),
    };
  }
}
