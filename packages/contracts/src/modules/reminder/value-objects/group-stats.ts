/**
 * Group Stats Value Object
 */

// ============ Interface Definitions ============

/** Group stats - Server interface. */
export interface IGroupStatsServer {
  /** Total template count */
  totalTemplates: number;
  /** Actually active template count */
  activeTemplates: number;
  /** Actually paused template count */
  pausedTemplates: number;
  /** Templates with selfEnabled = true */
  selfEnabledTemplates: number;
  /** Templates with selfEnabled = false */
  selfPausedTemplates: number;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        IGroupStatsServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IGroupStatsServer;

  // DTO conversion methods
}

/** Group stats - Client interface. */
export interface IGroupStatsClient {
  totalTemplates: number;
  activeTemplates: number;
  pausedTemplates: number;
  selfEnabledTemplates: number;
  selfPausedTemplates: number;

  // UI helper properties
  templateCountText: string; // "5 reminders"
  activeStatusText: string; // "3 active"

  // Value object methods

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Group Stats Server DTO
 */
export interface GroupStatsServerDTO {
  totalTemplates: number;
  activeTemplates: number;
  pausedTemplates: number;
  selfEnabledTemplates: number;
  selfPausedTemplates: number;
}

/**
 * Group Stats Client DTO
 */
export interface GroupStatsClientDTO {
  totalTemplates: number;
  activeTemplates: number;
  pausedTemplates: number;
  selfEnabledTemplates: number;
  selfPausedTemplates: number;
  templateCountText: string;
  activeStatusText: string;
}

/**
 * Group Stats Persistence DTO
 */
export interface GroupStatsPersistenceDTO {
  total_templates: number;
  active_templates: number;
  paused_templates: number;
  self_enabled_templates: number;
  self_paused_templates: number;
}

// ============ Type Exports ============

export type GroupStatsServer = IGroupStatsServer;
export type GroupStatsClient = IGroupStatsClient;
