/**
 * Account Availability Check Operations
 * 
 * This file contains DTOs for checking availability of account properties.
 * Used during registration or profile updates to ensure uniqueness.
 */

import { z } from 'zod';

// ============================================================================
// ACCOUNT AVAILABILITY Check
// ============================================================================

/**
 * 检查属性可用性 Schema
 */
export const CheckAvailabilitySchema = z.object({
  type: z.enum(['NICKNAME', 'EMAIL']),
  value: z.string(),
});

export type CheckAvailabilityReq = z.infer<typeof CheckAvailabilitySchema>;

export interface CheckAvailabilityRes {
  available: boolean;
  suggestion?: string;
}
