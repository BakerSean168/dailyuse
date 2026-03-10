import { z } from 'zod';

export const AccountAvailabilityFieldSchema = z.enum(['nickname', 'email']);

export const CheckAvailabilitySchema = z.object({
  type: AccountAvailabilityFieldSchema,
  value: z.string(),
});

export type CheckAvailabilityReq = z.infer<typeof CheckAvailabilitySchema>;

export interface CheckAvailabilityRes {
  available: boolean;
  suggestion?: string;
}
