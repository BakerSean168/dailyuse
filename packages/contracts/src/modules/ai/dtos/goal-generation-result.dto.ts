/**
 * Generated Goal Draft DTO
 */

import type { AiProviderConfigId } from '@/primitives';
import type { ImportanceLevel } from '../../../shared/value-objects/importance';

export enum GoalCategory {
  WORK = 'work',
  HEALTH = 'health',
  LEARNING = 'learning',
  PERSONAL = 'personal',
  FINANCE = 'finance',
  RELATIONSHIP = 'relationship',
  OTHER = 'other',
}

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

export interface KeyResultPreview {
  title: string;
  description?: string;
  targetValue: number;
  unit: string;
}

export interface GenerateGoalResultDTO {
  goal: GeneratedGoalDraft;
  keyResults?: KeyResultPreview[];
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  providerId: AiProviderConfigId;
  processingTimeMs: number;
}

export interface GenerateKeyResultsResultDTO {
  keyResults: KeyResultPreview[];
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  providerId: AiProviderConfigId;
  processingTimeMs: number;
}
