import { z } from 'zod';
import { AvailabilityResponseSchema } from './response-schemas';

export const AccountAvailabilityFieldSchema = z.enum(['nickname', 'email']);

export const CheckAvailabilitySchema = z.object({
  type: AccountAvailabilityFieldSchema,
  value: z.string(),
});

export type CheckAvailabilityReq = z.infer<typeof CheckAvailabilitySchema>;

// Residual 767: availability response dual retired — OpenAPI + transport use
// AvailabilityResponseSchema (semantic Res is a z.infer alias).
export type CheckAvailabilityRes = z.infer<typeof AvailabilityResponseSchema>;
