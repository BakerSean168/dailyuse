import type { IAIConversationApiClient, IResultHttpClient } from '../types';
import type {
  AIConversationClientDTO,
  ConversationListRes,
  CreateConversationReq,
  UpdateConversationReq,
} from '@dailyuse/contracts/ai';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIConversationHttpAdapter implements IAIConversationApiClient {
  private readonly baseUrl = '/ai/chat/conversations';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async createConversation(request: CreateConversationReq): Promise<AIConversationClientDTO> {
    const result = await this.httpClient.post<AIConversationClientDTO>(this.baseUrl, request);
    return unwrapResultOrThrow(result);
  }

  async updateConversation(
    id: string,
    request: UpdateConversationReq,
  ): Promise<AIConversationClientDTO> {
    const result = await this.httpClient.patch<AIConversationClientDTO>(
      `${this.baseUrl}/${id}`,
      request,
    );
    return unwrapResultOrThrow(result);
  }

  async getConversations(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ConversationListRes> {
    const result = await this.httpClient.get<ConversationListRes>(this.baseUrl, { params });
    return unwrapResultOrThrow(result);
  }

  async getConversationById(id: string): Promise<AIConversationClientDTO> {
    const result = await this.httpClient.get<AIConversationClientDTO>(`${this.baseUrl}/${id}`);
    return unwrapResultOrThrow(result);
  }

  async deleteConversation(id: string): Promise<void> {
    const result = await this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
    unwrapResultOrThrow(result);
  }
}
