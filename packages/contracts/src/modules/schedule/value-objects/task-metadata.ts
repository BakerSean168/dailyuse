/**
 * Task Metadata Value Object
 */

import type { TaskPriority } from './task-priority';

// ============ Interface Definitions ============

/** Task metadata interface. */
export interface ITaskMetadata {
  /** Business data (JSON) */
  payload: Record<string, unknown>;

  /** Tag list */
  tags: string[];

  /** Priority */
  priority: TaskPriority;

  /** Timeout (ms, null means no timeout) */
  timeout: number | null;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        ITaskMetadata,
        'equals' | 'with' | 'toDTO'
      >
    >,
  ): ITaskMetadata;

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Task Metadata DTO
 */
export interface TaskMetadataDTO {
  payload: Record<string, unknown>;
  tags: string[];
  priority: TaskPriority;
  timeout: number | null;
}
