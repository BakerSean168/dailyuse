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

  async getConversationById(id: string): Promise<AIConversationClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/${id}`);
  }

  async updateConversation(
    id: string,
    request: UpdateConversationReq,
  ): Promise<AIConversationClientDTO> {
    return this.httpClient.patch(`${this.baseUrl}/${id}`, request);
  }

  async deleteConversation(id: string): Promise<void> {
    return this.httpClient.delete(`${this.baseUrl}/${id}`);
  }

  // ===== Conversation Status =====

  async closeConversation(id: string): Promise<AIConversationClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${id}/close`);
  }

  async archiveConversation(id: string): Promise<AIConversationClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${id}/archive`);
  }
}
