/**
 * Item Name Value Object
 */
import { z } from 'zod';

export const ItemNameSchema = z.string().min(1).max(100);
export type ItemName = z.infer<typeof ItemNameSchema>;
