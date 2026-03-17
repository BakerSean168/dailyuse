import type { IAIConversationApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@dailyuse/contracts/electron';
import type {
  AIConversationClientDTO,
  ConversationListRes,
  CreateConversationReq,
  UpdateConversationReq,
} from '@dailyuse/contracts/ai';

export class AIConversationIpcAdapter implements IAIConversationApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createConversation(request: CreateConversationReq): Promise<AIConversationClientDTO> {
    const result = await this.ipcClient.invoke<AIConversationClientDTO>(
      AIChannels.CONVERSATION_CREATE,
      request,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async updateConversation(
    id: string,
    request: UpdateConversationReq,
  ): Promise<AIConversationClientDTO> {
    const result = await this.ipcClient.invoke<AIConversationClientDTO>(
      AIChannels.CONVERSATION_UPDATE,
      {
        id,
        ...request,
      },
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async getConversations(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ConversationListRes> {
    const result = await this.ipcClient.invoke<ConversationListRes>(
      AIChannels.CONVERSATION_LIST,
      params,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async getConversationById(id: string): Promise<AIConversationClientDTO> {
    const result = await this.ipcClient.invoke<AIConversationClientDTO>(
      AIChannels.CONVERSATION_GET,
      id,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async deleteConversation(id: string): Promise<void> {
    const result = await this.ipcClient.invoke<void>(AIChannels.CONVERSATION_DELETE, id);
    if (!result.ok) throw new Error(result.error.message);
  }
}
