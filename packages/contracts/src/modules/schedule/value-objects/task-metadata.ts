/**
 * Task Metadata Value Object
 */

import type { TaskPriority } from './task-priority';

// ============ Interface Definitions ============

/** Task metadata - Server interface. */
export interface ITaskMetadataServer {
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
        ITaskMetadataServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ITaskMetadataServer;

  // DTO conversion methods
}

/** Task metadata - Client interface. */
export interface ITaskMetadataClient {
  /** Business data */
  payload: Record<string, unknown>;

  /** Tag list */
  tags: string[];

  /** Priority */
  priority: TaskPriority;

  /** Timeout */
  timeout: number | null;

  // UI helper properties
  /** Priority display text */
  priorityDisplay: string; // "Low" | "Normal" | "High" | "Urgent"

  /** Priority color */
  priorityColor: string; // "gray" | "blue" | "orange" | "red"

  /** Tags display text */
  tagsDisplay: string; // "tag1, tag2, tag3"

  /** Formatted timeout */
  timeoutFormatted: string; // "30s" | "No limit"

  /** Payload summary */
  payloadSummary: string; // "3 fields"

  // Value object methods

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Task Metadata Server DTO
 */
export interface TaskMetadataServerDTO {
  payload: Record<string, unknown>;
  tags: string[];
  priority: TaskPriority;
  timeout: number | null;
}

/**
 * Task Metadata Client DTO
 */
export interface TaskMetadataClientDTO {
  payload: Record<string, unknown>;
  tags: string[];
  priority: TaskPriority;
  timeout: number | null;
  priorityDisplay: string;
  priorityColor: string;
  tagsDisplay: string;
  timeoutFormatted: string;
  payloadSummary: string;
}

/**
 * Task Metadata Persistence DTO
 */
export interface TaskMetadataPersistenceDTO {
  payload: string; // JSON.stringify(payload)
  tags: string; // JSON.stringify(tags)
  priority: string;
  timeout: number | null;
}

// ============ Type Exports ============

export type TaskMetadataServer = ITaskMetadataServer;
export type TaskMetadataClient = ITaskMetadataClient;
