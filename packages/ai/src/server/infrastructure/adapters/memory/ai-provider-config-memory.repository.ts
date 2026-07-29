/**
 * AIProviderConfig Memory Repository
 *
 * In-memory implementation of IAIProviderConfigRepository for testing.
 */

import type { IAIProviderConfigRepository } from '../../../domain';
import type { AIProviderConfigServerDTO } from '@memoflow/contracts/ai';

/**
 * AIProviderConfig Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class AIProviderConfigMemoryRepository implements IAIProviderConfigRepository {
  private configs = new Map<string, AIProviderConfigServerDTO>();

  async save(config: AIProviderConfigServerDTO): Promise<void> {
    const existing = this.configs.get(String(config.id));
    if (existing && String(existing.identityId) !== String(config.identityId)) {
      throw new Error('Provider config not found for the current identity.');
    }
    this.configs.set(String(config.id), config);
  }

  async findByIdForIdentity(
    identityId: string,
    id: string,
  ): Promise<AIProviderConfigServerDTO | null> {
    const config = this.configs.get(id) ?? null;
    if (!config || String(config.identityId) !== identityId) return null;
    return config;
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

  async delete(identityId: string, id: string): Promise<void> {
    const config = this.configs.get(id);
    if (!config || String(config.identityId) !== identityId) {
      throw new Error('Provider config not found for the current identity.');
    }
    this.configs.delete(id);
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
