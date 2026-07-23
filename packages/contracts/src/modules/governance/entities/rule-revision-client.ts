/**
 * RuleRevision Entity - Client Interface
 * 规则修订记录实体 - 客户端接口
 *
 * Residual 821: RuleRevisionClientDTO dual retired — sole RuleRevisionClientDTOSchema + z.infer.
 */

import type { z } from 'zod';
import { RuleRevisionClientDTOSchema } from '../api/response-schemas';

// Residual 821: RuleRevisionClientDTO dual retired — OpenAPI + transport use RuleRevisionClientDTOSchema.
export type RuleRevisionClientDTO = z.infer<typeof RuleRevisionClientDTOSchema>;
