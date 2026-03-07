/**
 * AI Goal Generation Input DTOs
 */

import type { GoalCategory } from './goal-generation-result.dto';

export interface GenerateGoalDTO {
  identityId: string;
  idea: string;
  context?: string;
  providerId?: import('../../../primitives').AiProviderConfigId;
  category?: GoalCategory;
  timeRange?: string;
  startDate?: number;
  endDate?: number;
  includeKeyResults?: boolean;
  keyResultCount?: number;
  timeframe?: {
    startDate?: number;
    endDate?: number;
  };
}

export interface GenerateKeyResultsDTO {
  identityId: string;
  goalTitle: string;
  goalDescription?: string;
  startDate: number;
  endDate: number;
  goalContext?: string;
  providerId?: import('../../../primitives').AiProviderConfigId;
}
