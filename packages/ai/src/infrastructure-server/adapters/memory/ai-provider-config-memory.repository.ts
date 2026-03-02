/**
 * AIProviderConfig Memory Repository
 *
 * In-memory implementation of IAIProviderConfigRepository for testing.
 */

import type { IAIProviderConfigRepository } from '../../../domain-server';
import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';

/**
 * AIProviderConfig Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class AIProviderConfigMemoryRepository implements IAIProviderConfigRepository {
  private configs = new Map<string, AIProviderConfigServerDTO>();

  async save(config: AIProviderConfigServerDTO): Promise<void> {
    this.configs.set(config.id, config);
  }

  async findById(id: string): Promise<AIProviderConfigServerDTO | null> {
    return this.configs.get(id) ?? null;
  }

  async findByIdentityId(identityId: string): Promise<AIProviderConfigServerDTO[]> {
    return Array.from(this.configs.values()).filter((c) => c.identityId === identityId);
  }

  async findDefaultByIdentityId(identityId: string): Promise<AIProviderConfigServerDTO | null> {
    return (
      Array.from(this.configs.values()).find((c) => c.identityId === identityId && c.isDefault) ??
      null
    );
  }

  async findByIdentityIdAndName(
    identityId: string,
    name: string,
  ): Promise<AIProviderConfigServerDTO | null> {
    return (
      Array.from(this.configs.values()).find(
        (c) => c.identityId === identityId && c.name === name,
      ) ?? null
    );
  }

  async delete(id: string): Promise<void> {
    this.configs.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.configs.has(id);
  }

  async clearDefaultForIdentity(identityId: string): Promise<void> {
    this.configs.forEach((c) => {
      if (c.identityId === identityId) {
        c.isDefault = false;
      }
    });
  }

  // Test helpers
  clear(): void {
    this.configs.clear();
  }

  seed(configs: AIProviderConfigServerDTO[]): void {
    configs.forEach((c) => this.configs.set(c.id, c));
  }
}
