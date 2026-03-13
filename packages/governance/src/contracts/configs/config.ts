/**
 * Governance Module - Configuration Constants. 治理模块 - 配置常量。
 *
 * 【规范说明：配置常量】
 * 定义模块的配置常量，用于：
 * - 业务规则配置
 * - 系统参数配置
 * - 默认值配置
 */

/**
 * Governance generation config. 治理实例生成配置。
 */
export const GOVERNANCE_GENERATION_CONFIG = {
  /**
   * 默认批次大小
   */
  DEFAULT_BATCH_SIZE: 50,

  /**
   * 最大批次大小
   */
  MAX_BATCH_SIZE: 200,

  /**
   * 默认优先级
   */
  DEFAULT_PRIORITY: 5,
} as const;

/**
 * Governance view config. 治理查看范围配置。
 */
export const GOVERNANCE_VIEW_CONFIG = {
  /**
   * 默认列表页大小
   */
  DEFAULT_PAGE_SIZE: 20,

  /**
   * 最大列表页大小
   */
  MAX_PAGE_SIZE: 100,

  /**
   * 默认排序字段
   */
  DEFAULT_SORT_BY: 'createdAt',

  /**
   * 默认排序顺序
   */
  DEFAULT_SORT_ORDER: 'desc',
} as const;

/**
 * Governance validation config. 治理验证配置。
 */
export const GOVERNANCE_VALIDATION_CONFIG = {
  /**
   * 名称最小长度
   */
  NAME_MIN_LENGTH: 1,

  /**
   * 名称最大长度
   */
  NAME_MAX_LENGTH: 256,

  /**
   * 描述最大长度
   */
  DESCRIPTION_MAX_LENGTH: 2000,

  /**
   * 最小优先级
   */
  MIN_PRIORITY: 1,

  /**
   * 最大优先级
   */
  MAX_PRIORITY: 10,
} as const;
