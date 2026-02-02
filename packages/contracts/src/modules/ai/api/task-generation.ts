import { z } from 'zod';
import type { TokenUsageClientDTO } from '../value-objects/token-usage';

// ============ 生成任务 ============

export const GenerateTasksSchema = z.object({
  goalId: z.string().uuid().optional(),
  keyResultId: z.string().uuid().optional(),
  description: z.string().min(10),
  context: z.string().optional(),
  taskCount: z.number().int().min(1).max(10).optional().default(5),
  providerId: z.string().uuid().optional(),
});

export type GenerateTasksReq = z.infer<typeof GenerateTasksSchema>;

export interface GeneratedTaskPreview {
  title: string;
  description?: string;
  estimatedDuration?: number;
  priority?: number;
  dependencies?: string[];
}

export interface GenerateTasksRes {
  tasks: GeneratedTaskPreview[];
  tokenUsage: TokenUsageClientDTO;
  providerId: string;
  processingTimeMs: number;
}
