/**
 * AI Conversation CRUD Operations
 *
 * Request/Response types for conversation management.
 * Follows authentication module pattern with Zod schemas.
 */

import { z } from 'zod';
import type { AIConversationClientDTO } from '../aggregates/ai-conversation-client';

// ============================================================================
// Create Conversation
// ============================================================================

export const CreateConversationSchema = z.object({
  name: z.string().min(1).max(200),
  systemPrompt: z.string().optional(),
});

export type CreateConversationReq = z.infer<typeof CreateConversationSchema>;
export type CreateConversationRes = AIConversationClientDTO;

// ============================================================================
// Update Conversation
// ============================================================================

export const UpdateConversationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

export type UpdateConversationReq = z.infer<typeof UpdateConversationSchema>;
export type UpdateConversationRes = AIConversationClientDTO;

// ============================================================================
// List Conversations
// ============================================================================

export const ListConversationsSchema = z.object({
  page: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(100).default(20).optional(),
  status: z.string().optional(),
});

export type ListConversationsQuery = z.infer<typeof ListConversationsSchema>;

export interface ConversationListRes {
  data: AIConversationClientDTO[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// Get / Delete Conversation (simple ID-based)
// ============================================================================

export type GetConversationReq = void;
export type GetConversationRes = AIConversationClientDTO;

export type DeleteConversationReq = void;
export type DeleteConversationRes = void;

export type CloseConversationReq = void;
export type CloseConversationRes = AIConversationClientDTO;

export type ArchiveConversationReq = void;
export type ArchiveConversationRes = AIConversationClientDTO;
