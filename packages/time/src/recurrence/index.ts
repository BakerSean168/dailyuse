import type { RecurrenceEnginePort } from './recurrence-engine.port';
import { createRRuleRecurrenceEngine } from './rrule-recurrence-engine';

/**
 * Selected MemoFlow recurrence engine. Consumers depend on the neutral port/factory,
 * not on the borrowed implementation name.
 */
export function createRecurrenceEngine(): RecurrenceEnginePort {
  return createRRuleRecurrenceEngine();
}
