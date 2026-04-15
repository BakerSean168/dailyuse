import { AIChannels, AIStreamChannels } from '@dailyuse/contracts/electron';
import type { MessageListRes, SendMessageReq, SendMessageRes } from '@dailyuse/contracts/ai';
import { unwrapOrThrowError } from '@dailyuse/contracts/result';
import type { IAIMessageApiClient, IResultIpcClient } from '../types';
import { createResultClientError, unwrapResultOrThrow } from '../result-client-error';

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

  async sendMessage(request: SendMessageReq): Promise<SendMessageRes> {
    const result = await this.ipcClient.invoke<SendMessageRes>(AIChannels.MESSAGE_SEND, request);
    return unwrapResultOrThrow(result);
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
      const result = await this.sendMessage(request);
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
  ): Promise<MessageListRes> {
    const result = await this.ipcClient.invoke<MessageListRes>(AIChannels.MESSAGE_LIST, {
      conversationId,
      ...params,
    });
    return unwrapResultOrThrow(result);
  }
}

function lastArg<T>(args: unknown[]): T | undefined {
  return args.at(-1) as T | undefined;
}

function createStreamId(): string {
  const crypto = globalThis.crypto;
  if (crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `stream-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
