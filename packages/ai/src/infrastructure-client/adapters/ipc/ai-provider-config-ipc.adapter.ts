/**
 * AI Provider Config IPC Adapter
 *
 * IPC implementation of IAIProviderConfigApiClient for Electron desktop app.
 */

import type { IIpcClient, IAIProviderConfigApiClient } from '../types';
import type {
  AIProviderConfigClientDTO,
  AIProviderConfigSummary,
  CreateAIProviderConfigReq,
  UpdateAIProviderConfigReq,
  TestAIProviderReq,
  TestAIProviderRes,
  RefreshProviderModelsRes,
} from '@dailyuse/contracts/ai';

/**
 * AI Provider Config IPC Adapter
 *
 * Implements IAIProviderConfigApiClient using Electron IPC.
 */
export class AIProviderConfigIpcAdapter implements IAIProviderConfigApiClient {
  private readonly channel = 'ai:provider';

  constructor(private readonly ipcClient: IIpcClient) {}

  // ===== Provider CRUD =====

  async createProvider(request: CreateAIProviderConfigReq): Promise<AIProviderConfigClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:create`, request);
  }

  async getProviders(): Promise<AIProviderConfigSummary[]> {
    return this.ipcClient.invoke(`${this.channel}:list`);
  }

  async getProviderById(id: string): Promise<AIProviderConfigClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:get`, id);
  }

  async updateProvider(
    id: string,
    request: UpdateAIProviderConfigReq,
  ): Promise<AIProviderConfigClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:update`, { id, ...request });
  }

  async deleteProvider(id: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:delete`, id);
  }

  // ===== Provider Operations =====

  async testConnection(request: TestAIProviderReq): Promise<TestAIProviderRes> {
    return this.ipcClient.invoke(`${this.channel}:test-connection`, request);
  }

  async setDefaultProvider(id: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:set-default`, id);
  }

  async refreshModels(id: string): Promise<RefreshProviderModelsRes> {
    return this.ipcClient.invoke(`${this.channel}:refresh-models`, id);
  }
}
