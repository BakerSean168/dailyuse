/**
 * Open chat turn port — application-facing conversation turn execution.
 *
 * ADR-035 stage 4 / residual 316: open-ended chat goes through the Turn Engine
 * path (DirectTurnEngine). Richer than ITurnEnginePort.startTurn so use cases
 * can return messages, usage, and provider metadata without bypassing the engine.
 */
import type { MessageClientDTO } from '@memoflow/contracts/ai';
import type { ChatExecutionUsage } from './chat-execution.port';

export interface OpenChatTurnInput {
  runId: string;
  identityId: string;
  conversationId: string;
  message: string;
  providerId?: string;
  model?: string;
  /**
   * Entry correlation request ID (from the caller's `ExecutionContext`).
   * Distinct from `runId`, which stays the durable ownership key only.
   * 入口 correlation request ID（来自调用方的 `ExecutionContext`）。
   * 与仅作为持久 ownership key 的 `runId` 严格区分。
   */
  requestId?: string;
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
