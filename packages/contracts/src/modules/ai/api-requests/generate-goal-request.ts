/**
 * Generate Goal Request DTO
 * AI 生成目标请求
 */

/**
 * 生成目标请求
 * 用户输入想法，AI 生成结构化的 OKR 目标
 */
export interface GenerateGoalRequest {
  /** 用户输入的原始想法/描述 */
  idea: string;

  /** 可选：期望的目标类别 */
  category?: GoalCategory;

  /** 可选：时间范围建议 */
  timeframe?: {
    /** 建议开始日期时间戳 */
    startDate?: number;
    /** 建议结束日期时间戳 */
    endDate?: number;
  };

  /** 可选：额外上下文信息 */
  context?: string;

  /** 可选：指定使用的 AI Provider ID（不指定则使用默认） */
  providerId?: string;

  /** 可选：是否同时生成 KRs（默认 false） */
  includeKeyResults?: boolean;

  /** 可选：生成的 KR 数量（3-5，默认 3） */
  keyResultCount?: number;
}

/**
 * 目标类别
 */
export enum GoalCategory {
  WORK = 'work',
  HEALTH = 'health',
  LEARNING = 'learning',
  PERSONAL = 'personal',
  FINANCE = 'finance',
  RELATIONSHIP = 'relationship',
  OTHER = 'other',
}

/**
 * 从想法生成完整 Goal + KRs 请求
 */
export interface GenerateGoalWithKRsRequest {
  /** 用户输入的原始想法 */
  idea: string;

  /** 可选：类别 */
  category?: GoalCategory;

  /** 可选：时间范围 */
  timeframe?: {
    startDate?: number;
    endDate?: number;
  };

  /** 可选：额外上下文 */
  context?: string;

  /** 可选：指定 Provider */
  providerId?: string;

  /** KR 数量（3-5，默认 3） */
  keyResultCount?: number;
}
