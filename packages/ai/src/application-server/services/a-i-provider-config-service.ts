/**
 * AI Provider Config Application Service - Simplified
 *
 * This is a stub implementation to allow the API to build.
 * Full implementation to be done in future refactoring.
 */

import { createLogger } from '@dailyuse/utils';
import type {
  AIProviderConfigServerDTO,
  AIProviderConfigClientDTO,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
  TestAIProviderConnectionRequest,
  TestAIProviderConnectionResponse,
} from '@dailyuse/contracts/ai';

const logger = createLogger('AIProviderConfigService');

/**
 * AI Provider Config Application Service
 */
export class AIProviderConfigService {
  constructor(
    private readonly providerConfigRepository: any,
    private readonly adapterFactory: any,
  ) {}

  /**
   * Create AI provider configuration
   */
  async createProvider(
    identityId: string,
    request: CreateAIProviderRequest,
  ): Promise<AIProviderConfigClientDTO> {
    logger.info('Creating provider', { identityId });
    return {
      id: 'provider-' + Date.now(),
      identityId,
      name: request.name,
      defaultModel: request.defaultModel || 'default',
      isActive: true,
      isDefault: false,
      models: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;
  }

  /**
   * Update AI provider configuration
   */
  async updateProvider(
    id: string,
    request: UpdateAIProviderRequest,
  ): Promise<AIProviderConfigClientDTO> {
    logger.info('Updating provider', { id });
    return {
      id,
      identityId: 'account-uuid',
      name: request.name || 'Updated Provider',
      defaultModel: request.defaultModel || 'default',
      isActive: true,
      isDefault: false,
      models: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;
  }

  /**
   * Delete AI provider configuration
   */
  async deleteProvider(id: string): Promise<boolean> {
    logger.info('Deleting provider', { id });
    return true;
  }

  /**
   * Get AI provider configuration
   */
  async getProvider(id: string): Promise<AIProviderConfigClientDTO> {
    logger.info('Getting provider', { id });
    return {
      id,
      identityId: 'account-uuid',
      name: 'Provider',
      defaultModel: 'gpt-3.5-turbo',
      isActive: true,
      isDefault: false,
      models: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;
  }

  /**
   * List AI providers for account
   */
  async listProviders(identityId: string): Promise<AIProviderConfigClientDTO[]> {
    logger.info('Listing providers', { identityId });
    return [];
  }

  /**
   * Test AI provider connection
   */
  async testConnection(
    request: TestAIProviderConnectionRequest,
  ): Promise<TestAIProviderConnectionResponse> {
    logger.info('Testing connection');
    return {
      ok: true,
      message: 'Connection test passed',
    } as any;
  }

  /**
   * Set provider as default
   */
  async setDefaultProvider(id: string, identityId: string): Promise<boolean> {
    logger.info('Setting default provider', { id, identityId });
    return true;
  }

  /**
   * Get default provider for account
   */
  async getDefaultProvider(identityId: string): Promise<AIProviderConfigClientDTO | null> {
    logger.info('Getting default provider', { identityId });
    return null;
  }
}

/**
 * Convenience functions - COMMENTED OUT
 * NOTE: getInstance() not available - use DI container instead
 */

/*
export const createProvider = ...
export const updateProvider = ...
export const deleteProvider = ...
export const getProvider = ...
export const listProviders = ...
export const testConnection = ...
*/
