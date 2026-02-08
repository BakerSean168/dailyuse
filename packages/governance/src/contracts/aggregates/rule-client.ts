import type { RuleSeverity, RuleStatus } from '../domain/rule.enums';
import type { RuleExampleDTO } from '../dtos/rule-example.dto';

export interface RuleClientDTO {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  status: RuleStatus;
  tags: string[];
  examples: RuleExampleDTO[];
  createdAt: string;
  updatedAt: string;
}
