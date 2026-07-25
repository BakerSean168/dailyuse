/**
 * Residual 403: session-scoped per-conversation open-chat Host turn memory.
 *
 * Keeps multi-engine open-chat timeline badges when switching conversations
 * within the same SPA session. Never writes browser storage or disk (no message
 * content retention outside in-memory maps). Presentation only — no Host mutations.
 */
import type { HostOpenChatTurnSnapshot } from './hostProposalLifecycle';

export type OpenChatHostTurnMemory = Record<string, HostOpenChatTurnSnapshot[]>;

const DEFAULT_MAX_TURNS = 8;

/** Upsert one open-chat turn into a ring list (newest first). */
export function upsertOpenChatHostTurnList(
  turns: HostOpenChatTurnSnapshot[],
  next: HostOpenChatTurnSnapshot,
  max: number = DEFAULT_MAX_TURNS,
): HostOpenChatTurnSnapshot[] {
  const runId = typeof next.runId === 'string' ? next.runId.trim() : '';
  if (!runId) return turns.slice();
  const rest = turns.filter((turn) => turn.runId !== runId);
  return [{ ...next, runId }, ...rest].slice(0, Math.max(1, max));
}

/** Remember turns for a conversation id (empty list clears the entry). */
export function rememberOpenChatHostTurnsForConversation(
  memory: OpenChatHostTurnMemory,
  conversationId: string | null | undefined,
  turns: HostOpenChatTurnSnapshot[],
): OpenChatHostTurnMemory {
  const id = typeof conversationId === 'string' ? conversationId.trim() : '';
  if (!id) return memory;
  const next: OpenChatHostTurnMemory = { ...memory };
  if (!turns.length) {
    delete next[id];
    return next;
  }
  next[id] = turns.map((turn) => ({ ...turn }));
  return next;
}

/** Restore a conversation's remembered turns (copy; empty when unknown). */
export function restoreOpenChatHostTurnsForConversation(
  memory: OpenChatHostTurnMemory,
  conversationId: string | null | undefined,
): HostOpenChatTurnSnapshot[] {
  const id = typeof conversationId === 'string' ? conversationId.trim() : '';
  if (!id) return [];
  const turns = memory[id];
  if (!Array.isArray(turns) || turns.length === 0) return [];
  return turns.map((turn) => ({ ...turn }));
}

/** Drop one conversation from memory (e.g. after delete). */
export function forgetOpenChatHostTurnsForConversation(
  memory: OpenChatHostTurnMemory,
  conversationId: string | null | undefined,
): OpenChatHostTurnMemory {
  const id = typeof conversationId === 'string' ? conversationId.trim() : '';
  if (!id || !(id in memory)) return memory;
  const next: OpenChatHostTurnMemory = { ...memory };
  delete next[id];
  return next;
}
