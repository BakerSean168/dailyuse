/**
 * Create Item Request/Response
 */
import { z } from 'zod';
import { ItemNameSchema } from '../value-objects';
import type { ItemClientDTO } from '../aggregates';

export const CreateItemSchema = z.object({
  name: ItemNameSchema,
});

export type CreateItemReq = z.infer<typeof CreateItemSchema>;
export type CreateItemRes = ItemClientDTO;
