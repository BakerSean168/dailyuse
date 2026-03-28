import type { IAIConversationApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@dailyuse/contracts/electron';
import type {
  AIConversationClientDTO,
  ConversationListRes,
  CreateConversationReq,
  UpdateConversationReq,
} from '@dailyuse/contracts/ai';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIConversationIpcAdapter implements IAIConversationApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createConversation(request: CreateConversationReq): Promise<AIConversationClientDTO> {
    const result = await this.ipcClient.invoke<AIConversationClientDTO>(
      AIChannels.CONVERSATION_CREATE,
      request,
    );
    return unwrapResultOrThrow(result);
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
    return unwrapResultOrThrow(result);
  }

  async getConversations(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ConversationListRes> {
    const result = await this.ipcClient.invoke<ConversationListRes>(
      AIChannels.CONVERSATION_LIST,
      params,
    );
    return unwrapResultOrThrow(result);
  }

  async getConversationById(id: string): Promise<AIConversationClientDTO> {
    const result = await this.ipcClient.invoke<AIConversationClientDTO>(
      AIChannels.CONVERSATION_GET,
      id,
    );
    return unwrapResultOrThrow(result);
  }

  async deleteConversation(id: string): Promise<void> {
    const result = await this.ipcClient.invoke<void>(AIChannels.CONVERSATION_DELETE, id);
    unwrapResultOrThrow(result);
  }
}
