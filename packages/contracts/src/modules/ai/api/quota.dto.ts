/**
 * AI Usage Quota Operations
 *
 * Request/Response types for AI usage quota management.
 * Follows authentication module pattern with Zod schemas.
 */

import { z } from 'zod';
import type { AIUsageQuotaClientDTO } from '../aggregates/ai-usage-quota-client';

// ============================================================================
// Get Quota
// ============================================================================

export type GetQuotaReq = void;
export type GetQuotaRes = AIUsageQuotaClientDTO;

// ============================================================================
// Update Quota Limit
// ============================================================================

export const UpdateQuotaLimitSchema = z.object({
  quotaLimit: z.number().int().min(0),
});

export type UpdateQuotaLimitReq = z.infer<typeof UpdateQuotaLimitSchema>;
export type UpdateQuotaLimitRes = AIUsageQuotaClientDTO;

// ============================================================================
// Check Quota Availability
// ============================================================================

export const CheckQuotaAvailabilitySchema = z.object({
  tokensNeeded: z.number().int().min(1),
});

export type CheckQuotaAvailabilityReq = z.infer<typeof CheckQuotaAvailabilitySchema>;
export type CheckQuotaAvailabilityRes = boolean;
