import type { IAIMessageApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@dailyuse/contracts/electron';
import type { MessageListRes, SendMessageReq, SendMessageRes } from '@dailyuse/contracts/ai';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIMessageIpcAdapter implements IAIMessageApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async sendMessage(request: SendMessageReq): Promise<SendMessageRes> {
    const result = await this.ipcClient.invoke<SendMessageRes>(AIChannels.MESSAGE_SEND, request);
    return unwrapResultOrThrow(result);
  }

  async streamMessage(
    request: SendMessageReq,
    handlers: {
      onChunk?: (chunk: { role: 'assistant'; content: string }) => void;
      onDone?: (result: {
        userMessage: SendMessageRes['userMessage'];
        assistantMessage: SendMessageRes['assistantMessage'];
        tokenUsage: SendMessageRes['tokenUsage'];
        providerId: SendMessageRes['providerId'];
        processingTimeMs: number;
      }) => void;
    },
  ): Promise<void> {
    const result = await this.sendMessage(request);
    handlers.onChunk?.({
      role: 'assistant',
      content: result.assistantMessage.content,
    });
    handlers.onDone?.(result);
  }

  async getMessages(
    conversationId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<MessageListRes> {
    const result = await this.ipcClient.invoke<MessageListRes>(AIChannels.MESSAGE_LIST, {
      conversationId,
      ...params,
    });
    return unwrapResultOrThrow(result);
  }
}
