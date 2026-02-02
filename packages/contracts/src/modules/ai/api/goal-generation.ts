import { z } from 'zod';
import type { TokenUsageClientDTO } from '../value-objects/token-usage';
import { ImportanceLevel } from '../../../shared/value-objects/importance';

// ============ Goal Category Enum ============

export enum GoalCategory {
  WORK = 'work',
  HEALTH = 'health',
  LEARNING = 'learning',
  PERSONAL = 'personal',
  FINANCE = 'finance',
  RELATIONSHIP = 'relationship',
  OTHER = 'other',
}

// ============ 生成目标 ============

export const GenerateGoalSchema = z.object({
  idea: z.string().min(10, '想法描述至少需要 10 个字符'),
  category: z.nativeEnum(GoalCategory).optional(),
  timeframe: z.object({
    startDate: z.number().int().optional(),
    endDate: z.number().int().optional(),
  }).optional(),
  context: z.string().optional(),
  providerId: z.string().uuid().optional(),
  includeKeyResults: z.boolean().optional().default(false),
  keyResultCount: z.number().int().min(3).max(5).optional().default(3),
});

export type GenerateGoalReq = z.infer<typeof GenerateGoalSchema>;

export interface GeneratedGoalDraft {
  title: string;
  description: string;
  motivation?: string;
  category: GoalCategory;
  suggestedStartDate: number;
  suggestedEndDate: number;
  importance: ImportanceLevel;
  tags: string[];
  feasibilityAnalysis?: string;
  aiInsights?: string;
}

export interface GenerateGoalRes {
  goal: GeneratedGoalDraft;
  keyResults?: Array<{
    title: string;
    description?: string;
    targetValue: number;
    unit: string;
  }>;
  tokenUsage: TokenUsageClientDTO;
  providerId: string;
  processingTimeMs: number;
}

// ============ 生成 Key Results ============

export const GenerateKeyResultsSchema = z.object({
  goalId: z.string().uuid(),
  goalTitle: z.string(),
  goalDescription: z.string().optional(),
  count: z.number().int().min(3).max(5).optional().default(3),
  providerId: z.string().uuid().optional(),
});

export type GenerateKeyResultsReq = z.infer<typeof GenerateKeyResultsSchema>;

export interface KeyResultPreview {
  title: string;
  description?: string;
  targetValue: number;
  unit: string;
}

export interface GenerateKeyResultsRes {
  keyResults: KeyResultPreview[];
  tokenUsage: TokenUsageClientDTO;
  providerId: string;
  processingTimeMs: number;
}
