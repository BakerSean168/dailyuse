import type { IAIConversationApiClient, IResultHttpClient } from '../types';
import type {
  AIConversationClientDTO,
  ConversationListRes,
  CreateConversationReq,
  UpdateConversationReq,
} from '@dailyuse/contracts/ai';

export class AIConversationHttpAdapter implements IAIConversationApiClient {
  private readonly baseUrl = '/ai/chat/conversations';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async createConversation(request: CreateConversationReq): Promise<AIConversationClientDTO> {
    const result = await this.httpClient.post<AIConversationClientDTO>(this.baseUrl, request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async updateConversation(
    id: string,
    request: UpdateConversationReq,
  ): Promise<AIConversationClientDTO> {
    const result = await this.httpClient.patch<AIConversationClientDTO>(
      `${this.baseUrl}/${id}`,
      request,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async getConversations(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ConversationListRes> {
    const result = await this.httpClient.get<ConversationListRes>(this.baseUrl, { params });
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async getConversationById(id: string): Promise<AIConversationClientDTO> {
    const result = await this.httpClient.get<AIConversationClientDTO>(`${this.baseUrl}/${id}`);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async deleteConversation(id: string): Promise<void> {
    const result = await this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
    if (!result.ok) throw new Error(result.error.message);
  }
}
