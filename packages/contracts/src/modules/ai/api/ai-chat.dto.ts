import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiConversationId, AiProviderConfigId } from '../../../primitives';
import type { AIConversationClientDTO } from '../aggregates/ai-conversation-client';
import type { MessageClientDTO } from '../entities/message-client';

/** Residual 673: shared conversation name body (create + update). */
export const ConversationNameSchema = z.object({
  name: z.string().trim().min(1).max(200),
});
export type CreateConversationReq = z.infer<typeof ConversationNameSchema>;
export type CreateConversationRes = AIConversationClientDTO;

export type UpdateConversationReq = z.infer<typeof ConversationNameSchema>;
export type UpdateConversationRes = AIConversationClientDTO;

const positiveIntFromQuery = z.coerce.number().int().min(1);

export const ListConversationsSchema = z.object({
  page: positiveIntFromQuery.optional().default(1),
  pageSize: positiveIntFromQuery.max(100).optional().default(20),
});
export type ListConversationsQuery = z.infer<typeof ListConversationsSchema>;

export interface ConversationListRes {
  data: AIConversationClientDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export type GetConversationReq = void;
export type GetConversationRes = AIConversationClientDTO;
export type DeleteConversationReq = void;
export type DeleteConversationRes = void;

export const SendMessageSchema = z.object({
  conversationId: brandedId<AiConversationId>(),
  content: z.string().trim().min(1),
  providerId: brandedId<AiProviderConfigId>().optional(),
  model: z.string().trim().min(1).max(120).optional(),
});
export type SendMessageReq = z.infer<typeof SendMessageSchema>;

export interface SendMessageRes {
  userMessage: MessageClientDTO;
  assistantMessage: MessageClientDTO;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  providerId: AiProviderConfigId;
  processingTimeMs: number;
}

export type StreamMessageChunk = {
  role: 'assistant';
  content: string;
};

export const ListMessagesSchema = z.object({
  conversationId: brandedId<AiConversationId>(),
  page: positiveIntFromQuery.optional().default(1),
  pageSize: positiveIntFromQuery.max(100).optional().default(50),
});
export type ListMessagesQuery = z.infer<typeof ListMessagesSchema>;

export interface MessageListRes {
  data: MessageClientDTO[];
  total: number;
  page: number;
  pageSize: number;
}
