import { z } from 'zod';

export const CheckAvailabilitySchema = z.object({
  type: z.enum(['NICKNAME', 'EMAIL']),
  value: z.string(),
});

export type CheckAvailabilityReq = z.infer<typeof CheckAvailabilitySchema>;

export interface CheckAvailabilityRes {
  available: boolean;
  suggestion?: string;
}
