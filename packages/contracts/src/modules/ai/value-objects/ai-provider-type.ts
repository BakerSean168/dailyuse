/**
 * AI 服务提供商类型
 * 用于用户自定义 Provider 配置
 */
export const AIProviderType = {
  /** OpenAI 官方 */
  OpenAI: 'OpenAI',
  /** 七牛云 AI (OpenAI 兼容) */
  Qiniu: 'Qiniu',
  /** Anthropic Claude */
  Anthropic: 'Anthropic',
  /** OpenRouter 聚合服务 */
  OpenRouter: 'OpenRouter',
  /** Groq 高速推理 */
  Groq: 'Groq',
  /** DeepSeek */
  DeepSeek: 'DeepSeek',
  /** SiliconFlow 硅基流动 */
  SiliconFlow: 'SiliconFlow',
  /** Google AI Studio */
  Google: 'Google',
  /** 自定义 OpenAI 兼容接口 */
  CustomOpenAICompatible: 'CustomOpenAICompatible',
} as const;

export type AIProviderType = (typeof AIProviderType)[keyof typeof AIProviderType];
