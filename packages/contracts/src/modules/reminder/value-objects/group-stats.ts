/**
 * Group Stats Value Object
 * 分组统计信息值对�?
 */

// ============ 接口定义 ============

/**
 * 分组统计信息 - Server 接口
 */
export interface IGroupStatsServer {
  /** 总模板数 */
  totalTemplates: number;
  /** 实际启用的模板数 */
  activeTemplates: number;
  /** 实际暂停的模板数 */
  pausedTemplates: number;
  /** selfEnabled = true 的模板数 */
  selfEnabledTemplates: number;
  /** selfEnabled = false 的模板数 */
  selfPausedTemplates: number;

  // 值对象方�?
  with(
    updates: Partial<
      Omit<
        IGroupStatsServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IGroupStatsServer;

  // DTO 转换方法
}

/**
 * 分组统计信息 - Client 接口
 */
export interface IGroupStatsClient {
  totalTemplates: number;
  activeTemplates: number;
  pausedTemplates: number;
  selfEnabledTemplates: number;
  selfPausedTemplates: number;

  // UI 辅助属�?
  templateCountText: string; // "5 个提�?
  activeStatusText: string; // "3 个活�?

  // 值对象方�?

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * Group Stats Server DTO
 */
export interface GroupStatsServerDTO {
  totalTemplates: number;
  activeTemplates: number;
  pausedTemplates: number;
  selfEnabledTemplates: number;
  selfPausedTemplates: number;
}

/**
 * Group Stats Client DTO
 */
export interface GroupStatsClientDTO {
  totalTemplates: number;
  activeTemplates: number;
  pausedTemplates: number;
  selfEnabledTemplates: number;
  selfPausedTemplates: number;
  templateCountText: string;
  activeStatusText: string;
}

/**
 * Group Stats Persistence DTO
 */
export interface GroupStatsPersistenceDTO {
  total_templates: number;
  active_templates: number;
  paused_templates: number;
  self_enabled_templates: number;
  self_paused_templates: number;
}

// ============ 类型导出 ============

export type GroupStatsServer = IGroupStatsServer;
export type GroupStatsClient = IGroupStatsClient;
