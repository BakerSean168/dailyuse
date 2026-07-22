/**
 * useAssistantDispatch — residual 349 thin UI entry for AssistantFacade.
 *
 * Routes Host commands through AIClientPort.dispatchAssistant (Web HTTP/SSE).
 * Never places identityId in the command body. Does not switch the full chat
 * workbench yet; open chat default path remains the existing chat session until residual follow-up.
 */
import { ref } from 'vue';
import type { AssistantClientCommand, AssistantEvent } from '@dailyuse/contracts/ai';
import type { AIChatService } from './types';

export interface UseAssistantDispatchOptions {
  service: Pick<AIChatService, 'dispatchAssistant'>;
}

export function useAssistantDispatch(options: UseAssistantDispatchOptions) {
  const dispatching = ref(false);
  const lastEvents = ref<AssistantEvent[]>([]);
  const lastError = ref<string | null>(null);
  const activeAbortController = ref<AbortController | null>(null);

  function abortActiveDispatch() {
    activeAbortController.value?.abort();
    activeAbortController.value = null;
  }

  async function dispatch(
    command: AssistantClientCommand,
    handlers?: {
      onEvent?: (event: AssistantEvent) => void;
    },
  ): Promise<AssistantEvent[]> {
    if ('identityId' in (command as object)) {
      throw new Error('identityId must not be included in AssistantClientCommand');
    }

    abortActiveDispatch();
    const controller = new AbortController();
    activeAbortController.value = controller;
    dispatching.value = true;
    lastError.value = null;
    const collected: AssistantEvent[] = [];
    lastEvents.value = collected;

    try {
      await options.service.dispatchAssistant(
        command,
        {
          onEvent: (event) => {
            collected.push(event);
            handlers?.onEvent?.(event);
          },
        },
        controller.signal,
      );
      lastEvents.value = [...collected];
      return collected;
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : 'Assistant dispatch failed';
      throw error;
    } finally {
      if (activeAbortController.value === controller) {
        activeAbortController.value = null;
      }
      dispatching.value = false;
    }
  }

  async function dispatchMessage(input: {
    conversationId: string;
    content: string;
    surface?: 'web' | 'desktop' | 'server';
    runId?: string;
    executionProfileId?: 'direct_turn' | 'pi_readonly';
    providerId?: string;
    model?: string;
    onEvent?: (event: AssistantEvent) => void;
  }) {
    return dispatch(
      {
        type: 'message',
        conversationId: input.conversationId,
        content: input.content,
        surface: input.surface ?? 'web',
        runId: input.runId,
        executionProfileId: input.executionProfileId,
        providerId: input.providerId,
        model: input.model,
      },
      { onEvent: input.onEvent },
    );
  }

  async function approveProposal(input: {
    runId: string;
    proposalId: string;
    revision: number;
    onEvent?: (event: AssistantEvent) => void;
  }) {
    return dispatch(
      {
        type: 'approve_proposal',
        runId: input.runId,
        proposalId: input.proposalId,
        revision: input.revision,
      },
      { onEvent: input.onEvent },
    );
  }

  async function rejectProposal(input: {
    runId: string;
    proposalId: string;
    revision: number;
    reason?: string;
    onEvent?: (event: AssistantEvent) => void;
  }) {
    return dispatch(
      {
        type: 'reject_proposal',
        runId: input.runId,
        proposalId: input.proposalId,
        revision: input.revision,
        reason: input.reason,
      },
      { onEvent: input.onEvent },
    );
  }

  async function cancelRun(input: {
    runId: string;
    onEvent?: (event: AssistantEvent) => void;
  }) {
    return dispatch(
      {
        type: 'cancel_run',
        runId: input.runId,
      },
      { onEvent: input.onEvent },
    );
  }

  return {
    dispatching,
    lastEvents,
    lastError,
    abortActiveDispatch,
    dispatch,
    dispatchMessage,
    approveProposal,
    rejectProposal,
    cancelRun,
  };
}
