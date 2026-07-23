/**
 * RuleTag Value Object
 * 规则标签值对象
 */

import { z } from 'zod';

// Residual 731: rule tag dual body retired — OpenAPI + transport use
// RuleTagDTOSchema (semantic RuleTagDTO is a z.infer alias).
export const RuleTagDTOSchema = z.object({
  value: z.string(),
});

export type RuleTagDTO = z.infer<typeof RuleTagDTOSchema>;
