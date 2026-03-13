import { z } from 'zod';
import type { RuleClientDTO } from '../aggregates';
import { RuleStatus } from '../value-objects/rule-status';
import { RuleSeverity } from '../value-objects/rule-severity';
import { RuleExamplesInputSchema } from '../dtos/rule-example.dto';

const RuleStatusValues = Object.values(RuleStatus);
const RuleSeverityValues = Object.values(RuleSeverity);

export const CreateRuleSchema = z.object({
  code: z.string().min(1, 'Rule code is required').max(64),
  title: z.string().min(1, 'Rule title is required').max(256),
  description: z.string().min(1, 'Rule description is required').max(4000),
  severity: z.enum(RuleSeverityValues),
  status: z.enum(RuleStatusValues),
  tags: z.array(z.string().min(1)).min(1, 'At least one tag is required'),
  examples: RuleExamplesInputSchema,
});

export type CreateRuleReq = z.infer<typeof CreateRuleSchema>;
export type CreateRuleRes = RuleClientDTO;
