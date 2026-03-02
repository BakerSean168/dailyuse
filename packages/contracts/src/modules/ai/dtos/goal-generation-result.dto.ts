/**
 * Generated Goal Draft DTO
 */

import type { AiProviderConfigId } from '../../../primitives';
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
  processingTimeMs: number; // NOTE: Used as 'processingTimeMs' in DTO but 'generatedAt' + logic in service?
  // Wait, the error said 'generatedAt' does not exist in type 'GenerateGoalResultDTO'.
  // The service returns:
  /*
    return {
      goal: goalDraft,
      tokenUsage: { ... },
      generatedAt: Date.now(), // <--- This field
      providerUsed: 'default', // <--- This field (mismatch with providerId)
      modelUsed: 'default',    // <--- This field
    };
  */
  // I should align the DTO with what the service is trying to return, or fix the service.
  // Given `generatedAt` seems useful, I'll add it.
  // Also `providerUsed` vs `providerId`. The DTO has `providerId` and `processingTimeMs`.
  // The service return object has `providerUsed`, `modelUsed`, `generatedAt`.
  // I will update the DTO to include optional fields that seem to be used by the service,
  // OR update the service to match this DTO.
  // Looking at the service code I saw earlier:
  /*
    const baseResponse: GenerateGoalResponse = {
      goal: goalDraft,
      tokenUsage: { ... },
      generatedAt: Date.now(),
      providerUsed: 'default',
      modelUsed: 'default',
    };
  */
  // It seems the service is using a DIFFERENT interface definition locally or assuming one.
  // But `GenerateGoalResponse` is an alias for `GenerateGoalResultDTO`.
  // So I must update `GenerateGoalResultDTO`.

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
