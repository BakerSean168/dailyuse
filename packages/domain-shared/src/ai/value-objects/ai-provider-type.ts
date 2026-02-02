import type { AIProviderType as IAIProviderType } from '@dailyuse/contracts/ai';

/**
 * AIProviderType 枚举类型
 * 
 * 【规范说明：枚举与常量对象规范】
 */

export type AIProviderType = IAIProviderType & { readonly __brand: unique symbol };

const VALUES: IAIProviderType[] = [
  'OpenAI',
  'Qiniu',
  'Anthropic',
  'OpenRouter',
  'Groq',
  'DeepSeek',
  'SiliconFlow',
  'Google',
  'CustomOpenAICompatible',
];

export const AIProviderType = {
  OpenAI: 'OpenAI' as AIProviderType,
  Qiniu: 'Qiniu' as AIProviderType,
  Anthropic: 'Anthropic' as AIProviderType,
  OpenRouter: 'OpenRouter' as AIProviderType,
  Groq: 'Groq' as AIProviderType,
  DeepSeek: 'DeepSeek' as AIProviderType,
  SiliconFlow: 'SiliconFlow' as AIProviderType,
  Google: 'Google' as AIProviderType,
  CustomOpenAICompatible: 'CustomOpenAICompatible' as AIProviderType,

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
    const compatibleProviders: AIProviderType[] = [
      this.OpenAI,
      this.Qiniu,
      this.OpenRouter,
      this.CustomOpenAICompatible,
    ];
    return compatibleProviders.includes(providerType);
  },
};
