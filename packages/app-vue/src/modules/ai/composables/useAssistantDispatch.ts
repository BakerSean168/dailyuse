/**
 * useAssistantDispatch — residual 349 thin UI entry for AssistantFacade.
 *
 * Routes Host commands through AIChatService.dispatchAssistant (Web HTTP/SSE or
 * Desktop IPC). Never places identityId in the command body, and the entry only
 * exposes dispatchAssistant — it never calls streamMessage / sendMessage. The
 * caller must provide an explicit `surface` (host-provided via DI); this shared
 * composable does not sniff `window` to guess the platform.
 *
 * Open chat send flows through `useAIChatSession`, which uses
 * `dispatchMessage()` from this entry (residual 349/351).
 */
import { ref } from 'vue';
import type { AssistantClientCommand, AssistantEvent } from '@memoflow/contracts/ai';
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
    externalSignal?: AbortSignal,
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

    const onExternalAbort = () => controller.abort();
    if (externalSignal?.aborted) {
      controller.abort();
    } else {
      externalSignal?.addEventListener('abort', onExternalAbort, { once: true });
    }

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
      externalSignal?.removeEventListener('abort', onExternalAbort);
      if (activeAbortController.value === controller) {
        activeAbortController.value = null;
      }
      dispatching.value = false;
    }
  }

  async function dispatchMessage(input: {
    conversationId: string;
    content: string;
    surface: 'web' | 'desktop' | 'server';
    runId?: string;
    executionProfileId?: 'direct_turn' | 'pi_readonly';
    providerId?: string;
    model?: string;
    signal?: AbortSignal;
    onEvent?: (event: AssistantEvent) => void;
  }) {
    return dispatch(
      {
        type: 'message',
        conversationId: input.conversationId,
        content: input.content,
        surface: input.surface,
        runId: input.runId,
        executionProfileId: input.executionProfileId,
        providerId: input.providerId,
        model: input.model,
      },
      { onEvent: input.onEvent },
      input.signal,
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

  async function reviseProposal(input: {
    runId: string;
    proposalId: string;
    revision: number;
    patch: {
      title?: string;
      description?: string | null;
      targetPath?: string;
      contentMarkdown?: string;
      goalId?: string | null;
    };
    onEvent?: (event: AssistantEvent) => void;
  }) {
    return dispatch(
      {
        type: 'revise_proposal',
        runId: input.runId,
        proposalId: input.proposalId,
        revision: input.revision,
        patch: input.patch,
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

  async function cancelRun(input: { runId: string; onEvent?: (event: AssistantEvent) => void }) {
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
    reviseProposal,
    rejectProposal,
    cancelRun,
  };
}
