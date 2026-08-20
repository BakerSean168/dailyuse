import { randomUUID } from 'node:crypto';
import { AgentController } from '@mastra/core/agent-controller';
import type { AgentControllerEvent } from '@mastra/core/agent-controller';
import { Mastra } from '@mastra/core/mastra';
import {
  MASTRA_RESOURCE_ID_KEY,
  MASTRA_THREAD_ID_KEY,
  RequestContext,
} from '@mastra/core/request-context';
import type { MastraCompositeStore } from '@mastra/core/storage';
import { Memory } from '@mastra/memory';
import type { AssistantRuntimeEvent } from '@memoflow/contracts/ai';
import { createMemoFlowAssistant } from '../agents';
import type { MastraModelResolver } from '../models';
import { AsyncEventQueue } from './async-event-queue';

function messageText(
  event: Extract<AgentControllerEvent, { type: 'message_update' | 'message_end' }>,
): string {
  const parts = event.message.content.parts;
  return parts
    .filter(
      (part): part is typeof part & { type: 'text'; text: string } =>
        part.type === 'text' && 'text' in part && typeof part.text === 'string',
    )
    .map((part) => part.text)
    .join('');
}

function normalizeRuntimeErrorCode(value: unknown): string {
  const normalized = String(value ?? 'MASTRA_RUNTIME_ERROR')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || 'MASTRA_RUNTIME_ERROR';
}

function publicRuntimeError(errorType?: unknown): { code: string; message: string } {
  return {
    code: normalizeRuntimeErrorCode(errorType),
    // Do not serialize provider/model/tool raw errors. They may contain request
    // URLs, headers, response bodies, or credentials. Detailed errors belong in
    // server-side observability only.
    message: 'AI runtime request failed',
  };
}

export interface MastraAIRuntimeDependencies {
  readonly storage: MastraCompositeStore;
  readonly modelResolver: MastraModelResolver;
}

type ActiveRun = {
  readonly identityId: string;
  readonly abort: () => void;
};

/** Mastra is the authoritative AI execution runtime; MemoFlow owns only product/domain truth. */
export class MastraAIRuntime {
  readonly memory: Memory;
  readonly assistant: ReturnType<typeof createMemoFlowAssistant>;
  readonly controller: AgentController;
  readonly mastra: Mastra;
  private initPromise: Promise<void> | null = null;
  private disposePromise: Promise<void> | null = null;
  private readonly activeRuns = new Map<string, ActiveRun>();

  constructor(private readonly deps: MastraAIRuntimeDependencies) {
    this.memory = new Memory({
      storage: deps.storage,
      options: { lastMessages: 40 },
    });
    this.assistant = createMemoFlowAssistant({
      modelResolver: deps.modelResolver,
      memory: this.memory,
    });
    this.controller = new AgentController({
      id: 'memoflow-assistant-controller',
      storage: deps.storage,
      memory: this.memory,
      agent: this.assistant,
      modes: [{ id: 'assistant', name: 'Assistant', availableTools: [] }],
      defaultModeId: 'assistant',
      disableBuiltinTools: [
        'ask_user',
        'submit_plan',
        'task_write',
        'task_update',
        'task_complete',
        'task_check',
        'subagent',
      ],
    });
    this.mastra = new Mastra({
      storage: deps.storage,
      agents: { assistant: this.assistant },
      agentControllers: { assistant: this.controller },
    });
  }

  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        await this.deps.storage.init();
        await this.controller.init();
      })();
    }
    await this.initPromise;
  }

  async dispose(): Promise<void> {
    if (!this.disposePromise) {
      this.disposePromise = (async () => {
        for (const run of this.activeRuns.values()) run.abort();
        this.activeRuns.clear();
        await this.memory.settled();
        const close = (this.deps.storage as { close?: () => Promise<void> }).close;
        if (close) await close.call(this.deps.storage);
      })();
    }
    await this.disposePromise;
  }

  /**
   * Cancel only a run owned by the authenticated identity. A guessed runId can
   * never become an authorization primitive.
   */
  cancelRun(input: { identityId: string; runId: string }): boolean {
    const active = this.activeRuns.get(input.runId);
    if (!active || active.identityId !== input.identityId) return false;
    active.abort();
    return true;
  }

  async *dispatchMessage(input: {
    identityId: string;
    conversationId: string;
    content: string;
    providerId?: string;
    modelId?: string;
    locale?: 'zh-CN' | 'en-US';
    signal?: AbortSignal;
  }): AsyncGenerator<AssistantRuntimeEvent, void, void> {
    await this.init();
    const requestContext = new RequestContext();
    requestContext.setRaw('identityId', input.identityId);
    if (input.providerId) requestContext.setRaw('providerId', input.providerId);
    if (input.modelId) requestContext.setRaw('modelId', input.modelId);
    requestContext.setRaw('locale', input.locale ?? 'zh-CN');
    requestContext.setRaw(MASTRA_RESOURCE_ID_KEY, input.identityId);
    requestContext.setRaw(MASTRA_THREAD_ID_KEY, input.conversationId);

    const session = await this.controller.createSession({
      id: `conversation:${input.conversationId}`,
      ownerId: input.identityId,
      resourceId: input.identityId,
      threadId: input.conversationId,
      requestContext,
    });
    const queue = new AsyncEventQueue<AssistantRuntimeEvent>();
    const fallbackRunId = `turn:${input.conversationId}:${randomUUID()}`;
    let runId = '';
    let sequence = 0;
    let lastText = '';
    let lastDeltaLength = 0;
    let assistantMessageId: string | undefined;
    let lastRuntimeError: { code: string; message: string } | undefined;
    let settled = false;

    const currentRunId = (): string => runId || session.getCurrentRunId() || fallbackRunId;

    const emit = <T extends AssistantRuntimeEvent['type']>(
      type: T,
      data: Extract<AssistantRuntimeEvent, { type: T }>['data'],
    ): void => {
      const id = currentRunId();
      sequence += 1;
      queue.push({
        eventId: `${id}:${sequence}`,
        runId: id,
        conversationId: input.conversationId,
        sequence,
        createdAt: Date.now(),
        type,
        data,
      } as Extract<AssistantRuntimeEvent, { type: T }>);
    };

    const settle = (
      type: 'assistant.run.completed' | 'assistant.run.failed' | 'assistant.run.cancelled',
    ): void => {
      if (settled) return;
      settled = true;
      if (type === 'assistant.run.completed') {
        emit(type, {
          content: lastText,
          ...(assistantMessageId ? { assistantMessageId } : {}),
        });
      } else if (type === 'assistant.run.failed') {
        emit(type, lastRuntimeError ?? publicRuntimeError());
      } else {
        emit(type, { reason: 'aborted' });
      }
      this.activeRuns.delete(currentRunId());
      queue.end();
    };

    const unsubscribe = session.subscribe((event) => {
      if (event.type === 'agent_start') {
        runId = session.getCurrentRunId() ?? fallbackRunId;
        this.activeRuns.set(runId, {
          identityId: input.identityId,
          abort: () => session.abortRun(),
        });
        emit('assistant.run.started', {
          ...(input.modelId ? { modelId: input.modelId } : {}),
          ...(input.providerId ? { providerId: input.providerId } : {}),
        });
        return;
      }
      if (event.type === 'message_update' && event.message.role === 'assistant') {
        const text = messageText(event);
        assistantMessageId = event.message.id;
        if (text.length > lastDeltaLength) {
          emit('assistant.message.delta', { content: text.slice(lastDeltaLength) });
          lastDeltaLength = text.length;
          lastText = text;
        }
        return;
      }
      if (event.type === 'message_end' && event.message.role === 'assistant') {
        lastText = messageText(event);
        assistantMessageId = event.message.id;
        return;
      }
      if (event.type === 'error') {
        lastRuntimeError = publicRuntimeError(event.errorType);
        return;
      }
      if (event.type === 'agent_end') {
        if (event.reason === 'aborted') settle('assistant.run.cancelled');
        else if (event.reason === 'error') settle('assistant.run.failed');
        else settle('assistant.run.completed');
      }
    });

    const abort = () => session.abortRun();
    input.signal?.addEventListener('abort', abort, { once: true });
    void session.sendMessage({ content: input.content, requestContext }).catch(() => {
      lastRuntimeError = publicRuntimeError();
      settle('assistant.run.failed');
    });

    try {
      while (true) {
        const next = await queue.next();
        if (next.done) break;
        yield next.value;
      }
    } finally {
      input.signal?.removeEventListener('abort', abort);
      unsubscribe();
      if (runId) this.activeRuns.delete(runId);
    }
  }
}
