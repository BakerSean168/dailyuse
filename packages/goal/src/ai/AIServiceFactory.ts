/**
 * AI Service Factory - Stub
 * TODO: 实现 AI 服务工厂
 */

export class AIServiceFactory {
  static create(_config?: Record<string, unknown>): AIServiceFactory {
    return new AIServiceFactory();
  }

  async generateText(_prompt: string): Promise<string> {
    throw new Error('AI service not implemented');
  }

  async generateStructured<T>(_prompt: string): Promise<T> {
    throw new Error('AI service not implemented');
  }
}
