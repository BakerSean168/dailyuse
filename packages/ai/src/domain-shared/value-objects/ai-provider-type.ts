import type { AIProviderType as IAIProviderType } from '@dailyuse/contracts/ai';

export type AIProviderType = IAIProviderType & { readonly __brand: unique symbol };

const VALUES: IAIProviderType[] = ['openai_compatible'];

export const AIProviderType = {
  OpenAICompatible: 'openai_compatible' as AIProviderType,

  of(value: string): AIProviderType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid AIProviderType: ${value}`);
    }
    return value as AIProviderType;
  },

  isValid(value: string): value is AIProviderType {
    return VALUES.includes(value as IAIProviderType);
  },

  getAll(): AIProviderType[] {
    return VALUES as AIProviderType[];
  },

  isOpenAICompatible(providerType: AIProviderType): boolean {
    return providerType === this.OpenAICompatible;
  },
};
