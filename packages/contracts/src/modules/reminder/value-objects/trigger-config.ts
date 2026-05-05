/**
 * Trigger Config Value Object
 */

import type { TriggerType } from './trigger-type';

// ============ Sub-config Interfaces ============

/** Fixed-time trigger configuration. */
export interface FixedTimeTrigger {
  /** Time in "HH:mm" format (e.g. "09:00") */
  time: string;
  /** Timezone (optional, defaults to user timezone) */
  timezone: string | null;
}

/** Interval trigger configuration. */
export interface IntervalTrigger {
  /** Every N minutes */
  minutes: number;
  /** Start time (epoch ms, optional) */
  startTime: number | null;
}

// ============ Interface Definitions ============

/** Trigger config interface. */
export interface ITriggerConfig {
  type: TriggerType;
  fixedTime: FixedTimeTrigger | null;
  interval: IntervalTrigger | null;

  // Value object methods
  with(
    updates: Partial<
      Omit<ITriggerConfig, 'equals' | 'with' | 'toDTO'>
    >,
  ): ITriggerConfig;

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Trigger Config DTO
 */
export interface TriggerConfigDTO {
  type: TriggerType;
  fixedTime: FixedTimeTrigger | null;
  interval: IntervalTrigger | null;
}
