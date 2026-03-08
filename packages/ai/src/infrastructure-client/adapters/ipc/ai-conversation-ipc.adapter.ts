import type { IAIConversationApiClient, IResultIpcClient } from '../types';
import type {
  AIConversationClientDTO,
  ConversationListRes,
  CreateConversationReq,
  UpdateConversationReq,
} from '@dailyuse/contracts/ai';

export class AIConversationIpcAdapter implements IAIConversationApiClient {
  private readonly channel = 'ai:chat:conversation';

  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createConversation(request: CreateConversationReq): Promise<AIConversationClientDTO> {
    const result = await this.ipcClient.invoke<AIConversationClientDTO>(
      `${this.channel}:create`,
      request,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async updateConversation(
    id: string,
    request: UpdateConversationReq,
  ): Promise<AIConversationClientDTO> {
    const result = await this.ipcClient.invoke<AIConversationClientDTO>(`${this.channel}:update`, {
      id,
      ...request,
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async getConversations(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ConversationListRes> {
    const result = await this.ipcClient.invoke<ConversationListRes>(`${this.channel}:list`, params);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async getConversationById(id: string): Promise<AIConversationClientDTO> {
    const result = await this.ipcClient.invoke<AIConversationClientDTO>(`${this.channel}:get`, id);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async deleteConversation(id: string): Promise<void> {
    const result = await this.ipcClient.invoke<void>(`${this.channel}:delete`, id);
    if (!result.ok) throw new Error(result.error.message);
  }
}
