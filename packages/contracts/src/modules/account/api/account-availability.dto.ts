import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { IdentityId } from '../value-objects/identity-id';

export const CheckAvailabilitySchema = z.object({
  type: z.enum(['NICKNAME', 'EMAIL']),
  value: z.string(),
});

export type CheckAvailabilityReq = z.infer<typeof CheckAvailabilitySchema>;

export interface CheckAvailabilityRes {
  available: boolean;
  suggestion?: string;
}
