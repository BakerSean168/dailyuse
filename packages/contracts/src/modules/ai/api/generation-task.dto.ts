/**
 * AI Generation Task CRUD Operations
 *
 * Request/Response types for generation task management (CRUD).
 * Separate from ai-task-generation.dto.ts which defines AI-powered task generation schemas.
 */

import { z } from 'zod';
import type { AIGenerationTaskClientDTO } from '../aggregates/ai-generation-task-client';

// ============================================================================
// Create Generation Task
// ============================================================================

export const CreateGenerationTaskSchema = z.object({
  type: z.enum([
    'GoalKeyResults',
    'TaskTemplates',
    'DocumentSummary',
    'KnowledgeDocuments',
    'GeneralChat',
    'GoalGeneration',
  ]),
  input: z.record(z.string(), z.unknown()),
  providerId: z.string().uuid().optional(),
});

export type CreateGenerationTaskReq = z.infer<typeof CreateGenerationTaskSchema>;
export type CreateGenerationTaskRes = AIGenerationTaskClientDTO;

// ============================================================================
// List Generation Tasks
// ============================================================================

export const ListGenerationTasksSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  type: z.string().optional(),
  status: z.string().optional(),
});

export type ListGenerationTasksQuery = z.infer<typeof ListGenerationTasksSchema>;

export interface GenerationTaskListRes {
  data: AIGenerationTaskClientDTO[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// Get / Cancel / Retry Generation Task (simple ID-based)
// ============================================================================

export type GetGenerationTaskReq = void;
export type GetGenerationTaskRes = AIGenerationTaskClientDTO;

export type CancelGenerationTaskReq = void;
export type CancelGenerationTaskRes = void;

export type RetryGenerationTaskReq = void;
export type RetryGenerationTaskRes = AIGenerationTaskClientDTO;
