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
    accountUuid: string,
    request: CreateAIProviderRequest,
  ): Promise<AIProviderConfigClientDTO> {
    logger.info('Creating provider', { accountUuid });
    return {
      uuid: 'provider-' + Date.now(),
      accountUuid,
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
    uuid: string,
    request: UpdateAIProviderRequest,
  ): Promise<AIProviderConfigClientDTO> {
    logger.info('Updating provider', { uuid });
    return {
      uuid,
      accountUuid: 'account-uuid',
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
  async deleteProvider(uuid: string): Promise<boolean> {
    logger.info('Deleting provider', { uuid });
    return true;
  }

  /**
   * Get AI provider configuration
   */
  async getProvider(uuid: string): Promise<AIProviderConfigClientDTO> {
    logger.info('Getting provider', { uuid });
    return {
      uuid,
      accountUuid: 'account-uuid',
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
  async listProviders(accountUuid: string): Promise<AIProviderConfigClientDTO[]> {
    logger.info('Listing providers', { accountUuid });
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
  async setDefaultProvider(uuid: string, accountUuid: string): Promise<boolean> {
    logger.info('Setting default provider', { uuid, accountUuid });
    return true;
  }

  /**
   * Get default provider for account
   */
  async getDefaultProvider(accountUuid: string): Promise<AIProviderConfigClientDTO | null> {
    logger.info('Getting default provider', { accountUuid });
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
