/**
 * AI Message Operations
 *
 * Request/Response types for message management and chat streaming.
 * Follows authentication module pattern with Zod schemas.
 */

import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { AiConversationId, AiProviderConfigId } from '@/primitives';
import type { MessageClientDTO } from '../entities/message-client';
import { MessageRole } from '../value-objects/message-role';

export const ChatStreamChunkType = {
  Content: 'content',
  Error: 'error',
  Done: 'done',
} as const;

export type ChatStreamChunkType = (typeof ChatStreamChunkType)[keyof typeof ChatStreamChunkType];

// ============================================================================
// Send Message
// ============================================================================

export const SendMessageSchema = z.object({
  conversationId: brandedId<AiConversationId>(),
  content: z.string().min(1),
  role: z.enum(MessageRole).default('User').optional(),
});

export type SendMessageReq = z.infer<typeof SendMessageSchema>;
export type SendMessageRes = MessageClientDTO;

// ============================================================================
// List Messages
// ============================================================================

export const ListMessagesSchema = z.object({
  conversationId: brandedId<AiConversationId>(),
  page: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(100).default(50).optional(),
});

export type ListMessagesQuery = z.infer<typeof ListMessagesSchema>;

export interface MessageListRes {
  data: MessageClientDTO[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// Chat Stream
// ============================================================================

export const ChatStreamSchema = z.object({
  conversationId: brandedId<AiConversationId>(),
  content: z.string().min(1),
  providerId: brandedId<AiProviderConfigId>().optional(),
});

export type ChatStreamReq = z.infer<typeof ChatStreamSchema>;

/**
 * Chat stream chunk - represents a single piece of streamed response
 */
export interface ChatStreamChunk {
  /** Chunk type */
  type: ChatStreamChunkType;
  /** Content fragment */
  content?: string;
  /** Error message if type is 'error' */
  error?: string;
  /** Token usage info when type is 'done' */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================================================
// Delete Message
// ============================================================================

export type DeleteMessageReq = void;
export type DeleteMessageRes = void;
