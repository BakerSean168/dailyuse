/**
 * AI Message Operations
 *
 * Request/Response types for message management and chat streaming.
 * Follows authentication module pattern with Zod schemas.
 */

import { z } from 'zod';
import type { MessageClientDTO } from '../entities/message-client';
import type { MessageRole } from '../value-objects/message-role';

// ============================================================================
// Send Message
// ============================================================================

export const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1),
  role: z.enum(['User', 'Assistant', 'System']).optional().default('User'),
});

export type SendMessageReq = z.infer<typeof SendMessageSchema>;
export type SendMessageRes = MessageClientDTO;

// ============================================================================
// List Messages
// ============================================================================

export const ListMessagesSchema = z.object({
  conversationId: z.string().uuid(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(50),
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
  conversationId: z.string().uuid(),
  content: z.string().min(1),
  providerId: z.string().uuid().optional(),
});

export type ChatStreamReq = z.infer<typeof ChatStreamSchema>;

/**
 * Chat stream chunk - represents a single piece of streamed response
 */
export interface ChatStreamChunk {
  /** Chunk type */
  type: 'content' | 'error' | 'done';
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
