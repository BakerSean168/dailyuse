/**
 * Open chat turn port — application-facing conversation turn execution.
 *
 * ADR-035 stage 4 / residual 316: open-ended chat goes through the Turn Engine
 * path (DirectTurnEngine). Richer than ITurnEnginePort.startTurn so use cases
 * can return messages, usage, and provider metadata without bypassing the engine.
 */
import type { MessageClientDTO } from '@dailyuse/contracts/ai';
import type { ChatExecutionUsage } from './chat-execution.port';

export interface OpenChatTurnInput {
  runId: string;
  identityId: string;
  conversationId: string;
  message: string;
  providerId?: string;
  model?: string;
  signal?: AbortSignal;
}

export interface OpenChatTurnResult {
  status: 'completed' | 'aborted' | 'failed';
  error?: string;
  content?: string;
  finishReason?: string;
  usage?: ChatExecutionUsage;
  providerId?: string;
  providerName?: string;
  model?: string;
  userMessage?: MessageClientDTO;
  assistantMessage?: MessageClientDTO;
}

export interface IOpenChatTurnPort {
  readonly engineId: string;
  executeConversationTurn(input: OpenChatTurnInput): Promise<OpenChatTurnResult>;
  streamConversationTurn(
    input: OpenChatTurnInput,
    onChunk: (chunk: { content: string }) => void,
  ): Promise<OpenChatTurnResult>;
  abort(runId: string): Promise<void>;
}
