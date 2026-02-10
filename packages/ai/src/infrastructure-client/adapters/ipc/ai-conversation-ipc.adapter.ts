/**
 * AI Conversation IPC Adapter
 *
 * IPC implementation of IAIConversationApiClient for Electron desktop app.
 */

import type { IAIConversationApiClient } from '../../ports/ai-conversation-api-client.port';
import type { IpcClient } from '../../../shared/ipc-client.types';
import type {
  AIConversationClientDTO,
  ConversationListResponse,
  CreateConversationRequest,
  UpdateConversationRequest,
} from '@dailyuse/contracts/ai';

/**
 * AI Conversation IPC Adapter
 *
 * Implements IAIConversationApiClient using Electron IPC.
 */
export class AIConversationIpcAdapter implements IAIConversationApiClient {
  private readonly channel = 'ai:conversation';

  constructor(private readonly ipcClient: IpcClient) {}

  // ===== Conversation CRUD =====

  async createConversation(request: CreateConversationRequest): Promise<AIConversationClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:create`, request);
  }

  async getConversations(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<ConversationListResponse> {
    return this.ipcClient.invoke(`${this.channel}:list`, params);
  }

  async getConversationById(uuid: string): Promise<AIConversationClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:get`, uuid);
  }

  async updateConversation(
    uuid: string,
    request: UpdateConversationRequest,
  ): Promise<AIConversationClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:update`, { uuid, ...request });
  }

  async deleteConversation(uuid: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:delete`, uuid);
  }

  // ===== Conversation Status =====

  async closeConversation(uuid: string): Promise<AIConversationClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:close`, uuid);
  }

  async archiveConversation(uuid: string): Promise<AIConversationClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:archive`, uuid);
  }
}
