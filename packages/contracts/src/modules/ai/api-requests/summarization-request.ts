/**
 * Summarization Request DTO
 */
export interface SummarizationRequest {
  /** 原始文本 (1-50,000 chars) */
  text: string;
  /** 目标语言 (zh-CN | en) 默认 zh-CN */
  language?: 'zh-CN' | 'en';
  /** 是否包含行动建议 默认 true */
  includeActions?: boolean;
}
