/**
 * RecurrenceRule Value Object - Server Interface
 */

import type { DomainDate, TransferDate, PersistenceDate } from '../../../primitives';
import type { RecurrenceFrequency } from './recurrence-frequency';
import type { DayOfWeek } from './day-of-week';

// ============ Interface Definitions ============

/** Recurrence rule interface. */
export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // Interval (e.g. every 2 days, every 3 weeks)
  daysOfWeek: DayOfWeek[]; // Days of week (used for WEEKLY frequency)
  endDate: DomainDate | null; // End date
  occurrences: number | null; // Number of occurrences
}

// ============ DTO Definitions ============

/** RecurrenceRule DTO. */
export interface RecurrenceRuleDTO {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: DayOfWeek[];
  endDate: TransferDate | null;
  occurrences: number | null;
}

/**
 * RecurrenceRule Persistence DTO
 */
export interface RecurrenceRulePersistenceDTO {
  frequency: string;
  interval: number;
  daysOfWeek: string; // JSON array
  endDate: PersistenceDate | null;
  occurrences: number | null;
}
