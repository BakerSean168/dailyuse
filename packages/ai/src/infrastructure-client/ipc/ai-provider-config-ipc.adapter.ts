/**
 * AI Provider Config IPC Adapter
 *
 * IPC implementation of IAIProviderConfigApiClient for Electron desktop app.
 */

import type { IAIProviderConfigApiClient } from '../../ports/ai-provider-config-api-client.port';
import type { IpcClient } from '../../../shared/ipc-client.types';
import type {
  AIProviderConfigClientDTO,
  AIProviderConfigSummary,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
  TestAIProviderConnectionRequest,
  TestAIProviderConnectionResponse,
  RefreshProviderModelsResponse,
} from '@dailyuse/contracts/ai';

/**
 * AI Provider Config IPC Adapter
 *
 * Implements IAIProviderConfigApiClient using Electron IPC.
 */
export class AIProviderConfigIpcAdapter implements IAIProviderConfigApiClient {
  private readonly channel = 'ai:provider';

  constructor(private readonly ipcClient: IpcClient) {}

  // ===== Provider CRUD =====

  async createProvider(request: CreateAIProviderRequest): Promise<AIProviderConfigClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:create`, request);
  }

  async getProviders(): Promise<AIProviderConfigSummary[]> {
    return this.ipcClient.invoke(`${this.channel}:list`);
  }

  async getProviderById(uuid: string): Promise<AIProviderConfigClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:get`, uuid);
  }

  async updateProvider(
    uuid: string,
    request: UpdateAIProviderRequest,
  ): Promise<AIProviderConfigClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:update`, { uuid, ...request });
  }

  async deleteProvider(uuid: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:delete`, uuid);
  }

  // ===== Provider Operations =====

  async testConnection(request: TestAIProviderConnectionRequest): Promise<TestAIProviderConnectionResponse> {
    return this.ipcClient.invoke(`${this.channel}:test-connection`, request);
  }

  async setDefaultProvider(uuid: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:set-default`, uuid);
  }

  async refreshModels(uuid: string): Promise<RefreshProviderModelsResponse> {
    return this.ipcClient.invoke(`${this.channel}:refresh-models`, uuid);
  }
}
