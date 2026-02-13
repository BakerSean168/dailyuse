/**
 * AI Service Factory - 管理 AI 提供商的注册和获�?
 * @module @/application-client
 */

import type { IAIService, AIServiceConfig } from './interfaces/IAIService';

/**
 * AI 服务工厂
 * 使用工厂模式管理不同�?AI 提供�?
 * 
 * 注意: OpenAIProvider 通过动态导入从 infrastructure-client 加载
 * 以避免循环依�?
 */
export class AIServiceFactory {
  private static providers = new Map<string, IAIService>();
  private static defaultProvider: string = 'openai';
  private static initialized = false;

  /**
   * 初始化工�?- 注册默认提供�?
   */
  static initialize(config: AIServiceConfig) {
    const provider = this.createProvider(config.provider, config);
    this.registerProvider(config.provider, provider);
    
    if (config.provider === 'openai') {
      this.defaultProvider = 'openai';
    }
    
    this.initialized = true;
    return this;
  }

  /**
   * 创建提供商实�?
   * 使用动态导入以避免循环依赖
   */
  static createProvider(
    providerType: 'openai' | 'anthropic' | 'local',
    config: AIServiceConfig
  ): IAIService {
    // 由于循环依赖问题，我们在运行时动态导�?
    // 调用者需要在应用启动时初始化正确的提供商
    
    switch (providerType) {
      case 'openai':
        // 动态导入由调用者处�?
        // 或者在应用初始化时直接注册
        throw new Error(
          'OpenAI provider must be registered manually. ' +
          'Use: AIServiceFactory.registerProvider("openai", new OpenAIProvider(config))'
        );
      case 'anthropic':
        throw new Error('Anthropic provider not yet implemented');
      case 'local':
        throw new Error('Local provider not yet implemented');
      default:
        throw new Error(`Unknown AI provider: ${providerType}`);
    }
  }

  /**
   * 注册提供�?
   */
  static registerProvider(name: string, provider: IAIService): void {
    this.providers.set(name, provider);
  }

  /**
   * 获取指定的提供商
   */
  static getProvider(name?: string): IAIService | undefined {
    const providerName = name || this.defaultProvider;
    return this.providers.get(providerName);
  }

  /**
   * 获取默认提供�?
   */
  static getDefaultProvider(): IAIService {
    if (!this.initialized) {
      throw new Error('Factory not initialized');
    }
    
    const provider = this.getProvider(this.defaultProvider);
    if (!provider) {
      throw new Error(
        `Default AI provider "${this.defaultProvider}" not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`
      );
    }
    return provider;
  }

  /**
   * 检查提供商是否已注�?
   */
  static hasProvider(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * 获取所有已注册的提供商名称
   */
  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 清空所有提供商（用于测试）
   */
  static clear(): void {
    this.providers.clear();
    this.initialized = false;
  }
}

