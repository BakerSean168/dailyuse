/**
 * Rule Aggregate Root - Client Contracts
 * 规则聚合根 - 客户端契约
 *
 * Residual 821: RuleClientDTO dual retired — sole RuleClientDTOSchema + z.infer.
 */

import type { z } from 'zod';
import { RuleClientDTOSchema } from '../api/response-schemas';

// Residual 821: RuleClientDTO dual retired — OpenAPI + transport use RuleClientDTOSchema.
export type RuleClientDTO = z.infer<typeof RuleClientDTOSchema>;
