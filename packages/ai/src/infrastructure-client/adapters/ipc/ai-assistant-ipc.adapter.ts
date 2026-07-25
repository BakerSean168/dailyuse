/**
 * AIAssistantIpcAdapter — residual 353 Desktop AssistantFacade dispatch stream.
 *
 * Mirrors AIMessageIpcAdapter stream lifecycle: start/cancel on AIChannels,
 * event/done/error on AIStreamChannels. identityId never appears in the body.
 */
import { AIChannels, AIStreamChannels } from '@dailyuse/contracts/electron';
import type { AssistantClientCommand, AssistantEvent } from '@dailyuse/contracts/ai';
import { unwrapOrThrowError } from '@dailyuse/contracts/result';
import type { IAIAssistantApiClient, IResultIpcClient } from '../types';
import { createResultClientError } from '../result-client-error';
// Residual 993: sole createStreamId (local dual retired).
import { createStreamId } from '../../../shared/create-stream-id';
// Residual 997: sole lastArg (local dual retired).
import { lastArg } from '../../../shared/last-arg';

type StreamErrorPayload = {
  streamId: string;
  code: string;
  message: string;
  details?: unknown;
};

export class AIAssistantIpcAdapter implements IAIAssistantApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async dispatchAssistant(
    command: AssistantClientCommand,
    handlers: {
      onEvent?: (event: AssistantEvent) => void;
      onDone?: (result: { eventCount: number }) => void;
    },
    signal?: AbortSignal,
  ): Promise<void> {
    if ('identityId' in (command as object)) {
      throw createResultClientError(
        'identityId must not be sent in assistant client commands',
        'VALIDATION_ERROR',
      );
    }

    const bridge = this.ipcClient.getBridge?.();
    if (!bridge) {
      throw createResultClientError(
        'AssistantFacade dispatch requires Desktop IPC stream bridge',
        'NOT_SUPPORTED',
      );
    }

    const streamId = createStreamId();
    const eventChannel = AIStreamChannels.ASSISTANT_DISPATCH_EVENT;
    const doneChannel = AIStreamChannels.ASSISTANT_DISPATCH_DONE;
    const errorChannel = AIStreamChannels.ASSISTANT_DISPATCH_ERROR;

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
      bridge.off(eventChannel, onEventPush);
      bridge.off(doneChannel, onDoneEvent);
      bridge.off(errorChannel, onErrorEvent);
      signal?.removeEventListener('abort', onAbort);
    };

    const settleOk = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolveStream();
    };

    const settleError = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      rejectStream(error);
    };

    const onEventPush = (...args: unknown[]) => {
      const payload = lastArg<{ streamId?: string; event?: AssistantEvent }>(args);
      if (!payload || payload.streamId !== streamId || !payload.event) {
        return;
      }
      handlers.onEvent?.(payload.event);
    };

    const onDoneEvent = (...args: unknown[]) => {
      const payload = lastArg<{ streamId?: string; result?: { eventCount: number } }>(args);
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
        createResultClientError(
          payload.message,
          payload.code,
          undefined,
          payload.details as never,
        ),
      );
    };

    const onAbort = () => {
      abortRequested = true;
      if (startCompleted) {
        void this.ipcClient.invoke(AIChannels.ASSISTANT_DISPATCH_CANCEL, streamId);
      }
      settleError(createResultClientError('请求已取消', 'ABORTED'));
    };

    bridge.on(eventChannel, onEventPush);
    bridge.on(doneChannel, onDoneEvent);
    bridge.on(errorChannel, onErrorEvent);

    if (signal?.aborted) {
      onAbort();
      await completion;
      return;
    }

    signal?.addEventListener('abort', onAbort, { once: true });

    try {
      const startResult = await this.ipcClient.invoke<void>(AIChannels.ASSISTANT_DISPATCH_START, {
        streamId,
        command,
      });
      unwrapOrThrowError(startResult);
      startCompleted = true;
      if (abortRequested) {
        void this.ipcClient.invoke(AIChannels.ASSISTANT_DISPATCH_CANCEL, streamId);
      }
    } catch (error) {
      cleanup();
      throw error;
    }

    await completion;
  }
}


