/**
 * Task Metadata Value Object
 */

import { z } from 'zod';
import type { TaskPriority } from './task-priority';
import { TaskPriority as TaskPriorityEnum } from './task-priority';

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

// Residual 749: TaskMetadataDTO dual body retired — OpenAPI response transport uses
// TaskMetadataSchema (semantic type is a z.infer alias). Request schemas stay local
// (partial/optional field set).

export const TaskMetadataSchema = z.object({
  payload: z.record(z.string(), z.unknown()),
  tags: z.array(z.string()),
  priority: z.enum(TaskPriorityEnum),
  timeout: z.number().nullable(),
});

export type TaskMetadataDTO = z.infer<typeof TaskMetadataSchema>;
