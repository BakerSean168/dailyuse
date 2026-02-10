/**
 * AI Conversation HTTP Adapter
 *
 * HTTP implementation of IAIConversationApiClient.
 */

import type { IAIConversationApiClient } from '../../ports/ai-conversation-api-client.port';
import type { HttpClient } from '../../../shared/http-client.types';
import type {
  AIConversationClientDTO,
  ConversationListResponse,
  CreateConversationRequest,
  UpdateConversationRequest,
} from '@dailyuse/contracts/ai';

/**
 * AI Conversation HTTP Adapter
 *
 * Implements IAIConversationApiClient using HTTP REST API calls.
 */
export class AIConversationHttpAdapter implements IAIConversationApiClient {
  private readonly baseUrl = '/ai/conversations';

  constructor(private readonly httpClient: HttpClient) {}

  // ===== Conversation CRUD =====

  async createConversation(request: CreateConversationRequest): Promise<AIConversationClientDTO> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getConversations(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<ConversationListResponse> {
    return this.httpClient.get(this.baseUrl, { params });
  }

  async getConversationById(uuid: string): Promise<AIConversationClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}`);
  }

  async updateConversation(
    uuid: string,
    request: UpdateConversationRequest,
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
