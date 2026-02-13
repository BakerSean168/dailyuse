/**
 * AI Service Interface and Config
 *
 * Defines the contract for AI service providers.
 */

/**
 * Configuration for AI service providers
 */
export interface AIServiceConfig {
  apiKey: string;
  provider: 'openai' | 'anthropic' | 'local';
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  baseUrl?: string;
}

/**
 * Request for goal decomposition
 */
export interface DecompositionRequest {
  goalTitle: string;
  goalDescription?: string;
  goalDeadline?: string;
  existingTasks?: Array<{ title: string }>;
  userContext?: string;
}

/**
 * Result of goal decomposition
 */
export interface DecompositionResult {
  tasks: Array<{
    title: string;
    description: string;
    estimatedMinutes: number;
    complexity: 'simple' | 'medium' | 'complex';
    dependencies: string[];
    suggestedOrder: number;
  }>;
  timeline: {
    totalEstimatedHours: number;
    estimatedDays?: number;
  };
  risks: Array<{
    description: string;
    mitigation: string;
  }>;
  confidence?: number;
}

/**
 * Interface for AI service providers
 */
export interface IAIService {
  decomposeGoal(request: DecompositionRequest): Promise<DecompositionResult>;
  estimateTaskTime(taskDescription: string): Promise<{
    estimatedMinutes: number;
    confidence: number;
    reasoning?: string;
  }>;
  suggestPriority(tasks: Array<{ title: string; description: string }>): Promise<{
    priorities: Array<{ title: string; priority: number }>;
    reasoning: string;
  }>;
  isAvailable(): Promise<boolean>;
}