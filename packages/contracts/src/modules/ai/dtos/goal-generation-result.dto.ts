/**
 * Generated Goal Draft DTO
 */

import type { AiProviderConfigId } from '../../../primitives';
import type { ImportanceLevel } from '../../../shared/value-objects/importance';
import type {
  KeyResultCalculationMethod,
  KeyResultValueType,
} from '../../goal/value-objects';

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
  valueType: KeyResultValueType;
  calculationMethod: KeyResultCalculationMethod;
  startValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  weight: number;
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
  generatedAt: number;
  providerUsed?: string;
  modelUsed?: string;
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
  generatedAt: number;
}
