import { AIChannels, AIStreamChannels } from '@memoflow/contracts/electron';
import type { MessageListRes, SendMessageReq, SendMessageRes } from '@memoflow/contracts/ai';
import { unwrapOrThrowError, type Result } from '@memoflow/contracts/result';
import type { IAIMessageApiClient, IResultIpcClient } from '../types';
import { createResultClientError, unwrapResultOrThrow } from '../result-client-error';
// Residual 993: sole createStreamId (local dual retired).
import { createStreamId } from '../../../shared/create-stream-id';
// Residual 997: sole lastArg (local dual retired).
import { lastArg } from '../../../shared/last-arg';

type StreamDonePayload = {
  userMessage: SendMessageRes['userMessage'];
  assistantMessage: SendMessageRes['assistantMessage'];
  tokenUsage: SendMessageRes['tokenUsage'];
  providerId: SendMessageRes['providerId'];
  processingTimeMs: number;
};

type StreamErrorPayload = {
  streamId: string;
  code: string;
  message: string;
  details?: unknown;
};

export class AIMessageIpcAdapter implements IAIMessageApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async sendMessage(request: SendMessageReq): Promise<Result<SendMessageRes>> {
    return this.ipcClient.invoke<SendMessageRes>(AIChannels.MESSAGE_SEND, request);
  }

  async streamMessage(
    request: SendMessageReq,
    handlers: {
      onChunk?: (chunk: { role: 'assistant'; content: string }) => void;
      onDone?: (result: StreamDonePayload) => void;
    },
    signal?: AbortSignal,
  ): Promise<void> {
    const bridge = this.ipcClient.getBridge?.();
    if (!bridge) {
      const result = unwrapResultOrThrow(await this.sendMessage(request));
      handlers.onChunk?.({ role: 'assistant', content: result.assistantMessage.content });
      handlers.onDone?.(result);
      return;
    }

    const streamId = createStreamId();
    const chunkChannel = AIStreamChannels.MESSAGE_STREAM_CHUNK;
    const doneChannel = AIStreamChannels.MESSAGE_STREAM_DONE;
    const errorChannel = AIStreamChannels.MESSAGE_STREAM_ERROR;

    let settled = false;
    let startCompleted = false;
    let abortRequested = false;

    let resolveStream!: () => void;
    let rejectStream!: (error: unknown) => void;
    const completion = new Promise<void>((resolve, reject) => {
      resolveStream = resolve;
      rejectStream = reject;
    });

    const cleanup = () => {
      bridge.off(chunkChannel, onChunkEvent);
      bridge.off(doneChannel, onDoneEvent);
      bridge.off(errorChannel, onErrorEvent);
      signal?.removeEventListener('abort', onAbort);
    };

    const settleOk = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolveStream();
    };

    const settleError = (error: unknown) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      rejectStream(error);
    };

    const onChunkEvent = (...args: unknown[]) => {
      const payload = lastArg<{
        streamId?: string;
        chunk?: { role: 'assistant'; content: string };
      }>(args);
      if (!payload || payload.streamId !== streamId || !payload.chunk) {
        return;
      }

      handlers.onChunk?.(payload.chunk);
    };

    const onDoneEvent = (...args: unknown[]) => {
      const payload = lastArg<{ streamId?: string; result?: StreamDonePayload }>(args);
      if (!payload || payload.streamId !== streamId || !payload.result) {
        return;
      }

      handlers.onDone?.(payload.result);
      settleOk();
    };

    const onErrorEvent = (...args: unknown[]) => {
      const payload = lastArg<StreamErrorPayload | undefined>(args);
      if (!payload || payload.streamId !== streamId) {
        return;
      }

      settleError(
        createResultClientError(payload.message, payload.code, undefined, payload.details as never),
      );
    };

    const onAbort = () => {
      abortRequested = true;
      if (startCompleted) {
        void this.ipcClient.invoke(AIChannels.MESSAGE_STREAM_CANCEL, streamId);
      }
      settleError(createResultClientError('请求已取消', 'ABORTED'));
    };

    bridge.on(chunkChannel, onChunkEvent);
    bridge.on(doneChannel, onDoneEvent);
    bridge.on(errorChannel, onErrorEvent);

    if (signal?.aborted) {
      onAbort();
      await completion;
      return;
    }

    signal?.addEventListener('abort', onAbort, { once: true });

    try {
      const startResult = await this.ipcClient.invoke<void>(AIChannels.MESSAGE_STREAM_START, {
        ...request,
        streamId,
      });

      unwrapOrThrowError(startResult);

      startCompleted = true;
      if (abortRequested) {
        void this.ipcClient.invoke(AIChannels.MESSAGE_STREAM_CANCEL, streamId);
      }
    } catch (error) {
      cleanup();
      throw error;
    }

    await completion;
  }

  async getMessages(
    conversationId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<Result<MessageListRes>> {
    return this.ipcClient.invoke<MessageListRes>(AIChannels.MESSAGE_LIST, {
      conversationId,
      ...params,
    });
  }
}


