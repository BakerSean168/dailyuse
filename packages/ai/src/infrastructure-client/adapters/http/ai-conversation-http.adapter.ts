/**
 * AI Conversation HTTP Adapter
 *
 * HTTP implementation of IAIConversationApiClient.
 */

import type { IHttpClient, IAIConversationApiClient } from '../types';
import type {
  AIConversationClientDTO,
  ConversationListRes,
  CreateConversationReq,
  UpdateConversationReq,
} from '@dailyuse/contracts/ai';

/**
 * AI Conversation HTTP Adapter
 *
 * Implements IAIConversationApiClient using HTTP REST API calls.
 */
export class AIConversationHttpAdapter implements IAIConversationApiClient {
  private readonly baseUrl = '/ai/conversations';

  constructor(private readonly httpClient: IHttpClient) {}

  // ===== Conversation CRUD =====

  async createConversation(request: CreateConversationReq): Promise<AIConversationClientDTO> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getConversations(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<ConversationListRes> {
    return this.httpClient.get(this.baseUrl, { params });
  }

  async getConversationById(uuid: string): Promise<AIConversationClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}`);
  }

  async updateConversation(
    uuid: string,
    request: UpdateConversationReq,
  ): Promise<AIConversationClientDTO> {
    return this.httpClient.patch(`${this.baseUrl}/${uuid}`, request);
  }

  async deleteConversation(uuid: string): Promise<void> {
    return this.httpClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Conversation Status =====

  async closeConversation(uuid: string): Promise<AIConversationClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/close`);
  }

  async archiveConversation(uuid: string): Promise<AIConversationClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/archive`);
  }
}
