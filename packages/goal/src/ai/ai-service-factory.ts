/**
 * AI Service Factory
 *
 * Provides AI service capabilities for goal-related features
 * (e.g., generating key results, suggesting metrics).
 *
 * Returns a no-op implementation when no AI backend is configured.
 * Concrete AI integrations (OpenAI, etc.) can be registered via
 * the module's DI container.
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIServiceFactory');

export interface IAIService {
  generateText(prompt: string): Promise<string>;
  generateStructured<T>(prompt: string): Promise<T>;
}

export class NoOpAIService implements IAIService {
  async generateText(_prompt: string): Promise<string> {
    logger.warn('AI service not configured — returning empty response');
    return '';
  }

  async generateStructured<T>(_prompt: string): Promise<T> {
    logger.warn('AI service not configured — returning empty object');
    return {} as T;
  }
}

export class AIServiceFactory {
  private static instance: IAIService | null = null;

  static configure(service: IAIService): void {
    AIServiceFactory.instance = service;
  }

  static create(_config?: Record<string, unknown>): IAIService {
    if (AIServiceFactory.instance) {
      return AIServiceFactory.instance;
    }
    return new NoOpAIService();
  }

  static reset(): void {
    AIServiceFactory.instance = null;
  }
}
