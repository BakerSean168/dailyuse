import type { AiProviderConfigId } from '../../../primitives';
import type { GeneratedGoalDraft, KeyResultPreview } from './goal-generation-result.dto';

export interface RefineGoalResultDTO {
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
