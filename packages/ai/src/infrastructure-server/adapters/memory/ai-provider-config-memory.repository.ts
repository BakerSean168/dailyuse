/**
 * AIProviderConfig Memory Repository
 *
 * In-memory implementation of IAIProviderConfigRepository for testing.
 */

import type { IAIProviderConfigRepository } from '../../ports/ai-provider-config-repository.port';
import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';

/**
 * AIProviderConfig Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class AIProviderConfigMemoryRepository implements IAIProviderConfigRepository {
  private configs = new Map<string, AIProviderConfigServerDTO>();

  async save(config: AIProviderConfigServerDTO): Promise<void> {
    this.configs.set(config.uuid, config);
  }

  async findByUuid(uuid: string): Promise<AIProviderConfigServerDTO | null> {
    return this.configs.get(uuid) ?? null;
  }

  async findByAccountUuid(accountUuid: string): Promise<AIProviderConfigServerDTO[]> {
    return Array.from(this.configs.values()).filter((c) => c.accountUuid === accountUuid);
  }

  async findDefaultByAccountUuid(accountUuid: string): Promise<AIProviderConfigServerDTO | null> {
    return (
      Array.from(this.configs.values()).find((c) => c.accountUuid === accountUuid && c.isDefault) ?? null
    );
  }

  async findByAccountUuidAndName(accountUuid: string, name: string): Promise<AIProviderConfigServerDTO | null> {
    return (
      Array.from(this.configs.values()).find((c) => c.accountUuid === accountUuid && c.name === name) ?? null
    );
  }

  async delete(uuid: string): Promise<void> {
    this.configs.delete(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    return this.configs.has(uuid);
  }

  async clearDefaultForAccount(accountUuid: string): Promise<void> {
    this.configs.forEach((c) => {
      if (c.accountUuid === accountUuid) {
        c.isDefault = false;
      }
    });
  }

  // Test helpers
  clear(): void {
    this.configs.clear();
  }

  seed(configs: AIProviderConfigServerDTO[]): void {
    configs.forEach((c) => this.configs.set(c.uuid, c));
  }
}
