/**
 * Goal Status Auto-Update Rules (STORY-021)
 * 目标状态自动更新规则定义
 */

import type { GoalStatus } from '../value-objects/goal-status';

/**
 * 规则条件类型
 */
export type RuleConditionType = 'all' | 'any';

/**
 * 指标类型
 */
export type RuleMetric = 'progress' | 'deadline' | 'weight' | 'kr_count';

/**
 * 操作符
 */
export type RuleOperator = '>' | '<' | '=' | '>=' | '<=' | '!=';

/**
 * 单个规则条件
 */
export interface RuleCondition {
  /**
   * 指标类型
   */
  metric: RuleMetric;

  /**
   * 操作符
   */
  operator: RuleOperator;

  /**
   * 比较值
   */
  value: number;

  /**
   * 可选：应用范围（all KRs, any KR, specific KR）
   */
  scope?: 'all' | 'any' | string; // string 为 KR UUID
}

/**
 * 规则动作
 */
export interface RuleAction {
  /**
   * 目标状态
   */
  status: GoalStatus;

  /**
   * 是否发送通知
   */
  notify: boolean;

  /**
   * 通知消息（可选）
   */
  message?: string;
}

/**
 * 状态更新规则
 */
export interface StatusRule {
  /**
   * 规则 ID
   */
  id: string;

  /**
   * 规则名称
   */
  name: string;

  /**
   * 规则描述
   */
  description?: string;

  /**
   * 是否启用
   */
  enabled: boolean;

  /**
   * 优先级（数字越大优先级越高）
   */
  priority: number;

  /**
   * 条件类型（all: 所有条件满足，any: 任一条件满足）
   */
  conditionType: RuleConditionType;

  /**
   * 规则条件列表
   */
  conditions: RuleCondition[];

  /**
   * 执行动作
   */
  action: RuleAction;

  /**
   * 创建时间
   */
  createdAt: number;

  /**
   * 更新时间
   */
  updatedAt: number;
}

/**
 * 规则执行结果
 */
export interface RuleExecutionResult {
  /**
   * 规则 ID
   */
  ruleId: string;

  /**
   * 是否匹配
   */
  matched: boolean;

  /**
   * 执行的动作（如果匹配）
   */
  action?: RuleAction;

  /**
   * 匹配的条件详情
   */
  matchedConditions?: string[];

  /**
   * 执行时间
   */
  executedAt: number;
}

/**
 * 规则集配置
 */
export interface RuleSetConfig {
  /**
   * 是否启用自动规则
   */
  enabled: boolean;

  /**
   * 规则列表
   */
  rules: StatusRule[];

  /**
   * 是否允许手动覆盖
   */
  allowManualOverride: boolean;

  /**
   * 最后执行时间
   */
  lastExecutedAt?: number;
}
