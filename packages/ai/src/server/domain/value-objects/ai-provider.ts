import type { AIProvider as IAIProvider } from '@dailyuse/contracts/ai';

/**
 * AIProvider 枚举类型
 * 
 * 【规范说明：枚举与常量对象规范】
 */

export type AIProvider = IAIProvider & { readonly __brand: unique symbol };

const VALUES: IAIProvider[] = ['OpenAI', 'Anthropic', 'Custom'];

export const AIProvider = {
  OpenAI: 'OpenAI' as AIProvider,
  Anthropic: 'Anthropic' as AIProvider,
  Custom: 'Custom' as AIProvider,

  of(value: string): AIProvider {
    if (!this.isValid(value)) {
      throw new Error(`Invalid AIProvider: ${value}`);
    }
    return value as AIProvider;
  },

  isValid(value: string): value is AIProvider {
    return VALUES.includes(value as IAIProvider);
  },

  getAll(): AIProvider[] {
    return VALUES as AIProvider[];
  },

  isOpenAI(provider: AIProvider): boolean {
    return provider === this.OpenAI;
  },

  isAnthropic(provider: AIProvider): boolean {
    return provider === this.Anthropic;
  },

  isCustom(provider: AIProvider): boolean {
    return provider === this.Custom;
  },
};
