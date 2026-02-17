/**
 * Get Item Request/Response
 */
import { z } from 'zod';
import type { ItemClientDTO } from '../aggregates';

export const GetItemSchema = z.object({
  itemId: z.string().uuid(),
});

export type GetItemReq = z.infer<typeof GetItemSchema>;
export type GetItemRes = ItemClientDTO;
