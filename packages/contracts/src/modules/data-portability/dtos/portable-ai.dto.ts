/**
 * Portable AI DTOs
 */

import { z } from 'zod';
import { PortableRefSchema, IsoDateString } from './portable-common.dto';

export const PortableAIMessageSchema = z
  .object({
    _ref: PortableRefSchema,
    role: z.string(),
    content: z.string(),
    tokenCount: z.number().nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableAIMessage = z.infer<typeof PortableAIMessageSchema>;

export const PortableAIConversationSchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    status: z.string(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
    messages: z.array(PortableAIMessageSchema),
  })
  .strict();

export type PortableAIConversation = z.infer<typeof PortableAIConversationSchema>;

export const PortableAIDataSchema = z
  .object({
    conversations: z.array(PortableAIConversationSchema),
  })
  .strict();

export type PortableAIData = z.infer<typeof PortableAIDataSchema>;
