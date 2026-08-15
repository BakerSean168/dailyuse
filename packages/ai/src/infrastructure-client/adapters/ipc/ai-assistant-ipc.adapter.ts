/**
 * AIAssistantIpcAdapter — residual 353 Desktop AssistantFacade dispatch stream.
 *
 * Mirrors AIMessageIpcAdapter stream lifecycle: start/cancel on AIChannels,
 * event/done/error on AIStreamChannels. identityId never appears in the body.
 *
 * Hardening (plan Step B §5.2):
 * - EVENT/DONE/ERROR envelope AND inner payload are runtime validated against
 *   the shared schemas; malformed envelopes become `ASSISTANT_PROTOCOL_ERROR`.
 * - A missing bridge or a START that is rejected as NOT_SUPPORTED/NOT_FOUND is
 *   normalized to `ASSISTANT_DISPATCH_UNAVAILABLE`. Once START succeeds, an
 *   ERROR frame or stream break is never downgraded to unavailable.
 * - streamId isolation, once-settlement and listener/abort cleanup are kept.
 */
import { AIChannels, AIStreamChannels } from '@memoflow/contracts/electron';
import {
  ASSISTANT_DISPATCH_UNAVAILABLE,
  ASSISTANT_PROTOCOL_ERROR,
  AssistantDispatchResultSchema,
  AssistantEventSchema,
  type AssistantClientCommand,
  type AssistantDispatchHandlers,
} from '@memoflow/contracts/ai';
import { unwrapOrThrowError } from '@memoflow/contracts/result';
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

type StartResult = {
  ok: boolean;
  error?: { code?: string };
};

function normalizeStartFailure(error: unknown): unknown {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (code === 'NOT_SUPPORTED' || code === 'NOT_FOUND') {
      return createResultClientError(
        'AssistantFacade dispatch is not available on this host',
        ASSISTANT_DISPATCH_UNAVAILABLE,
      );
    }
  }
  return error;
}

export class AIAssistantIpcAdapter implements IAIAssistantApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async dispatchAssistant(
    command: AssistantClientCommand,
    handlers: AssistantDispatchHandlers,
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
        ASSISTANT_DISPATCH_UNAVAILABLE,
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

    const protocolError = (message: string) =>
      createResultClientError(message, ASSISTANT_PROTOCOL_ERROR);

    const onEventPush = (...args: unknown[]) => {
      const payload = lastArg<{ streamId?: unknown; event?: unknown }>(args);
      if (!payload || payload.streamId !== streamId) {
        return;
      }
      const parsed = AssistantEventSchema.safeParse(payload.event);
      if (!parsed.success) {
        settleError(protocolError('Assistant IPC event payload failed protocol validation'));
        return;
      }
      handlers.onEvent?.(parsed.data);
    };

    const onDoneEvent = (...args: unknown[]) => {
      const payload = lastArg<{ streamId?: unknown; result?: unknown }>(args);
      if (!payload || payload.streamId !== streamId) {
        return;
      }
      const parsed = AssistantDispatchResultSchema.safeParse(payload.result);
      if (!parsed.success) {
        settleError(protocolError('Assistant IPC done payload failed protocol validation'));
        return;
      }
      handlers.onDone?.(parsed.data);
      settleOk();
    };

    const onErrorEvent = (...args: unknown[]) => {
      const payload = lastArg<StreamErrorPayload | undefined>(args);
      if (!payload || payload.streamId !== streamId) {
        return;
      }
      if (typeof payload.code !== 'string' || typeof payload.message !== 'string') {
        settleError(protocolError('Assistant IPC error envelope is malformed'));
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
      const startResult = await this.ipcClient.invoke<StartResult>(
        AIChannels.ASSISTANT_DISPATCH_START,
        {
          streamId,
          command,
        },
      );
      unwrapOrThrowError(startResult);
      startCompleted = true;
      if (abortRequested) {
        void this.ipcClient.invoke(AIChannels.ASSISTANT_DISPATCH_CANCEL, streamId);
      }
    } catch (error) {
      cleanup();
      throw normalizeStartFailure(error);
    }

    await completion;
  }
}
