/**
 * AI Provider Template
 * AI 服务提供商预设模板
 *
 * 用于快速配置常用的 AI 服务提供商
 */

import { AIProviderType } from '../value-objects/ai-provider-type';

/**
 * AI Provider 模板接口
 */
export interface AIProviderTemplate {
  /** 模板唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 简短描述 */
  description: string;
  /** 图标名称 (Vuetify MDI icon) */
  icon: string;
  /** 图标/品牌颜色 */
  color: string;
  /** 提供商类型 */
  providerType: AIProviderType;
  /** 默认 API 基础地址 */
  baseUrl: string;
  /** 认证类型 */
  authType: 'bearer' | 'x-api-key';
  /** API Key 获取链接 */
  apiKeyUrl?: string;
  /** 是否有免费额度 */
  hasFreeQuota: boolean;
  /** 免费额度说明 */
  freeQuotaNote?: string;
  /** 推荐的默认模型 */
  recommendedModels?: string[];
  /** 是否支持获取模型列表 */
  supportsModelList: boolean;
}

/**
 * 预设的 AI Provider 模板列表
 */
export const AI_PROVIDER_TEMPLATES: AIProviderTemplate[] = [
  // ===== 推荐的免费/低价服务 =====
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: '聚合多家 AI 模型，部分模型免费',
    icon: 'mdi-router-wireless',
    color: '#6366f1',
    providerType: AIProviderType.OpenRouter,
    baseUrl: 'https://openrouter.ai/api/v1',
    authType: 'bearer',
    apiKeyUrl: 'https://openrouter.ai/keys',
    hasFreeQuota: true,
    freeQuotaNote: '多个免费模型可用',
    recommendedModels: ['google/gemini-2.0-flash-exp:free', 'meta-llama/llama-3.2-3b-instruct:free'],
    supportsModelList: true,
  },
  {
    id: 'groq',
    name: 'Groq',
    description: '超快推理速度，免费使用',
    icon: 'mdi-lightning-bolt',
    color: '#f55036',
    providerType: AIProviderType.Groq,
    baseUrl: 'https://api.groq.com/openai/v1',
    authType: 'bearer',
    apiKeyUrl: 'https://console.groq.com/keys',
    hasFreeQuota: true,
    freeQuotaNote: '每天免费额度',
    recommendedModels: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    supportsModelList: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '国产高性价比模型',
    icon: 'mdi-brain',
    color: '#0066ff',
    providerType: AIProviderType.DeepSeek,
    baseUrl: 'https://api.deepseek.com/v1',
    authType: 'bearer',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    hasFreeQuota: true,
    freeQuotaNote: '新用户有免费额度',
    recommendedModels: ['deepseek-chat', 'deepseek-coder'],
    supportsModelList: true,
  },
  {
    id: 'qiniu',
    name: '七牛云 AI',
    description: '七牛云 AI 服务，支持多种模型',
    icon: 'mdi-cloud',
    color: '#07beff',
    providerType: AIProviderType.Qiniu,
    baseUrl: 'https://openai.qiniu.com/v1',
    authType: 'bearer',
    apiKeyUrl: 'https://portal.qiniu.com/ai/llm/token',
    hasFreeQuota: true,
    freeQuotaNote: '有免费调用额度',
    recommendedModels: ['deepseek-v3', 'deepseek-r1'],
    supportsModelList: true,
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    description: '硅基流动，高性价比推理平台',
    icon: 'mdi-chip',
    color: '#8b5cf6',
    providerType: AIProviderType.SiliconFlow,
    baseUrl: 'https://api.siliconflow.cn/v1',
    authType: 'bearer',
    apiKeyUrl: 'https://cloud.siliconflow.cn/account/ak',
    hasFreeQuota: true,
    freeQuotaNote: '免费模型可用',
    recommendedModels: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-7B-Instruct'],
    supportsModelList: true,
  },

  // ===== 主流付费服务 =====
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'ChatGPT 官方 API',
    icon: 'mdi-head-snowflake',
    color: '#10a37f',
    providerType: AIProviderType.OpenAI,
    baseUrl: 'https://api.openai.com/v1',
    authType: 'bearer',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    hasFreeQuota: false,
    recommendedModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    supportsModelList: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 系列模型',
    icon: 'mdi-account-voice',
    color: '#d97706',
    providerType: AIProviderType.Anthropic,
    baseUrl: 'https://api.anthropic.com/v1',
    authType: 'x-api-key',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    hasFreeQuota: false,
    recommendedModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    supportsModelList: false,
  },
  {
    id: 'google',
    name: 'Google AI Studio',
    description: 'Gemini 系列模型，有免费额度',
    icon: 'mdi-google',
    color: '#4285f4',
    providerType: AIProviderType.Google,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    authType: 'bearer',
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
    hasFreeQuota: true,
    freeQuotaNote: '每分钟有免费调用限制',
    recommendedModels: ['gemini-2.0-flash-exp', 'gemini-1.5-pro'],
    supportsModelList: true,
  },

  // ===== 自定义 =====
  {
    id: 'custom',
    name: '自定义',
    description: '配置其他 OpenAI 兼容接口',
    icon: 'mdi-cog',
    color: '#6b7280',
    providerType: AIProviderType.CustomOpenAICompatible,
    baseUrl: '',
    authType: 'bearer',
    hasFreeQuota: false,
    supportsModelList: true,
  },
];

/**
 * 根据 ID 获取模板
 */
export function getTemplateById(id: string): AIProviderTemplate | undefined {
  return AI_PROVIDER_TEMPLATES.find(t => t.id === id);
}

/**
 * 根据 Provider 类型获取模板
 */
export function getTemplatesByType(type: AIProviderType): AIProviderTemplate[] {
  return AI_PROVIDER_TEMPLATES.filter(t => t.providerType === type);
}

/**
 * 获取有免费额度的模板
 */
export function getFreeTemplates(): AIProviderTemplate[] {
  return AI_PROVIDER_TEMPLATES.filter(t => t.hasFreeQuota);
}
