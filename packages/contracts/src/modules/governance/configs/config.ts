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
 *
 * These constants are the single source of truth for validation limits.
 * Zod schemas in contracts/api/ reference these values directly.
 * 这些常量是验证限制的唯一事实来源。contracts/api/ 中的 Zod Schema 直接引用这些值。
 */
export const GOVERNANCE_VALIDATION_CONFIG = {
  /** Rule code regex pattern. 规则编码正则。 */
  CODE_PATTERN: /^[A-Z]+-[0-9]+$/ as RegExp,

  /** Minimum title length. 标题最小长度。 */
  TITLE_MIN_LENGTH: 3,

  /** Maximum title length. 标题最大长度。 */
  TITLE_MAX_LENGTH: 100,

  /** Minimum description length. 描述最小长度。 */
  DESCRIPTION_MIN_LENGTH: 10,

  /** Maximum description length. 描述最大长度。 */
  DESCRIPTION_MAX_LENGTH: 5000,

  /** Maximum tag length. 单个标签最大长度。 */
  TAG_MAX_LENGTH: 50,

  /** Maximum caption length. 示例标题最大长度。 */
  CAPTION_MAX_LENGTH: 200,

  /** Maximum liveReferenceLocation length. 实际应用位置最大长度。 */
  LIVE_REFERENCE_MAX_LENGTH: 500,

  /** Maximum deprecation reason length. 废弃原因最大长度。 */
  DEPRECATION_REASON_MAX_LENGTH: 500,

  /** Minimum deprecation reason length. 废弃原因最小长度。 */
  DEPRECATION_REASON_MIN_LENGTH: 10,
} as const;
