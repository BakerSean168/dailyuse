import type { MastraDBMessage } from '@mastra/core/agent';
import type { AssistantRuntimeHistoryView } from '@memoflow/contracts/ai';
import type { AssistantTranscriptBootstrapSource } from './assistant-transcript-bootstrap.port';

const TRANSCRIPT_BOOTSTRAP_METADATA_KEY = 'memoflowTranscriptBootstrapVersion';
const TRANSCRIPT_BOOTSTRAP_VERSION = 1;

type ThreadView = {
  id: string;
  resourceId: string;
  title?: string;
  metadata?: Record<string, unknown>;
};

interface AssistantMemoryPort {
  getThreadById(input: { threadId: string; resourceId?: string }): Promise<ThreadView | null>;
  createThread(input: {
    resourceId: string;
    threadId?: string;
    title?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ThreadView>;
  updateThread(input: {
    id: string;
    title?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ThreadView>;
  deleteThread(threadId: string): Promise<void>;
  saveMessages(input: { messages: MastraDBMessage[] }): Promise<unknown>;
  recall(input: { threadId: string; perPage: false }): Promise<{ messages: MastraDBMessage[] }>;
}

export class AssistantConversationUnavailableError extends Error {
  readonly code = 'ASSISTANT_CONVERSATION_NOT_FOUND';

  constructor() {
    super('Conversation unavailable');
    this.name = 'AssistantConversationUnavailableError';
  }
}

function toMastraMessage(input: {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  threadId: string;
  resourceId: string;
}): MastraDBMessage {
  return {
    id: input.id,
    role: input.role,
    createdAt: new Date(input.createdAt),
    threadId: input.threadId,
    resourceId: input.resourceId,
    type: 'text',
    content: {
      format: 2,
      parts: [{ type: 'text', text: input.content }],
    },
  };
}

function messageText(message: MastraDBMessage): string {
  return message.content.parts
    .filter(
      (part): part is typeof part & { type: 'text'; text: string } =>
        part.type === 'text' && 'text' in part && typeof part.text === 'string',
    )
    .map((part) => part.text)
    .join('');
}

/**
 * Owns the one-time AiMessage -> Mastra memory bootstrap and all authoritative
 * open-chat history reads after cutover.
 */
export class AssistantHistoryService {
  private readonly bootstrapInFlight = new Map<string, Promise<void>>();

  constructor(
    private readonly memory: AssistantMemoryPort,
    private readonly bootstrapSource: AssistantTranscriptBootstrapSource,
  ) {}

  async ensureConversation(input: { identityId: string; conversationId: string }): Promise<void> {
    const key = `${input.identityId}\u0000${input.conversationId}`;
    const current = this.bootstrapInFlight.get(key);
    if (current) {
      await current;
      return;
    }

    const pending = this.bootstrap(input).finally(() => {
      if (this.bootstrapInFlight.get(key) === pending) this.bootstrapInFlight.delete(key);
    });
    this.bootstrapInFlight.set(key, pending);
    await pending;
  }

  async listMessages(input: {
    identityId: string;
    conversationId: string;
  }): Promise<AssistantRuntimeHistoryView> {
    await this.ensureConversation(input);
    const recalled = await this.memory.recall({
      threadId: input.conversationId,
      perPage: false,
    });

    const messages = recalled.messages
      .filter(
        (message): message is MastraDBMessage & { role: 'user' | 'assistant' | 'system' } =>
          message.role === 'user' || message.role === 'assistant' || message.role === 'system',
      )
      .map((message) => ({
        id: message.id,
        conversationId: input.conversationId,
        role: message.role,
        content: messageText(message),
        createdAt: message.createdAt.getTime(),
      }))
      .sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id));

    return { conversationId: input.conversationId, messages };
  }

  async deleteConversation(input: {
    identityId: string;
    conversationId: string;
  }): Promise<boolean> {
    const thread = await this.memory.getThreadById({
      threadId: input.conversationId,
      resourceId: input.identityId,
    });
    if (!thread || thread.resourceId !== input.identityId) return false;
    await this.memory.deleteThread(input.conversationId);
    return true;
  }

  private async bootstrap(input: { identityId: string; conversationId: string }): Promise<void> {
    let thread = await this.memory.getThreadById({
      threadId: input.conversationId,
      resourceId: input.identityId,
    });
    if (thread && thread.resourceId !== input.identityId) {
      throw new AssistantConversationUnavailableError();
    }
    if (thread?.metadata?.[TRANSCRIPT_BOOTSTRAP_METADATA_KEY] === TRANSCRIPT_BOOTSTRAP_VERSION) {
      return;
    }

    const snapshot = await this.bootstrapSource.load(input);
    if (!snapshot) throw new AssistantConversationUnavailableError();

    if (!thread) {
      thread = await this.memory.createThread({
        threadId: input.conversationId,
        resourceId: input.identityId,
        title: snapshot.title,
        metadata: {},
      });
    }

    if (snapshot.messages.length > 0) {
      await this.memory.saveMessages({
        messages: snapshot.messages.map((message) =>
          toMastraMessage({
            ...message,
            threadId: input.conversationId,
            resourceId: input.identityId,
          }),
        ),
      });
    }

    await this.memory.updateThread({
      id: input.conversationId,
      metadata: {
        ...(thread.metadata ?? {}),
        [TRANSCRIPT_BOOTSTRAP_METADATA_KEY]: TRANSCRIPT_BOOTSTRAP_VERSION,
      },
    });
  }
}
