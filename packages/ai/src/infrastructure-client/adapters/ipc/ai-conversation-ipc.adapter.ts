/**
 * AI Conversation IPC Adapter
 *
 * IPC implementation of IAIConversationApiClient for Electron desktop app.
 */

import type { IIpcClient, IAIConversationApiClient } from '../types';
import type {
  AIConversationClientDTO,
  ConversationListRes,
  CreateConversationReq,
  UpdateConversationReq,
} from '@dailyuse/contracts/ai';

/**
 * AI Conversation IPC Adapter
 *
 * Implements IAIConversationApiClient using Electron IPC.
 */
export class AIConversationIpcAdapter implements IAIConversationApiClient {
  private readonly channel = 'ai:conversation';

  constructor(private readonly ipcClient: IIpcClient) {}

  // ===== Conversation CRUD =====

  async createConversation(request: CreateConversationReq): Promise<AIConversationClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:create`, request);
  }

  async getConversations(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<ConversationListRes> {
    return this.ipcClient.invoke(`${this.channel}:list`, params);
  }

  async getConversationById(id: string): Promise<AIConversationClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:get`, id);
  }

  async updateConversation(
    id: string,
    request: UpdateConversationReq,
  ): Promise<AIConversationClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:update`, { id, ...request });
  }

  async deleteConversation(id: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:delete`, id);
  }

  // ===== Conversation Status =====

  async closeConversation(id: string): Promise<AIConversationClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:close`, id);
  }

  async archiveConversation(id: string): Promise<AIConversationClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:archive`, id);
  }
}
