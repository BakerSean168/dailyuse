/**
 * 目标进度分解详情
 * 
 * 提供目标进度的详细计算信息，包括每个关键结果的贡献度
 */

/**
 * 进度分解详情
 */
export interface ProgressBreakdown {
  /** 目标总进度百分比 (0-100) */
  totalProgress: number;
  
  /** 计算模式：加权平均 */
  calculationMode: 'weighted_average';
  
  /** 各关键结果的贡献度列表 */
  krContributions: Array<{
    /** 关键结果 UUID */
    keyResultUuid: string;
    
    /** 关键结果名称 */
    keyResultName: string;
    
    /** 关键结果进度百分比 (0-100) */
    progress: number;
    
    /** 关键结果权重 (0-100) */
    weight: number;
    
    /** 对目标总进度的贡献度 (0-100) */
    contribution: number;
  }>;
  
  /** 最后更新时间（时间戳） */
  lastUpdateTime: number;
  
  /** 更新触发方式 */
  updateTrigger: string;
}

/**
 * 进度分解响应
 */
export interface ProgressBreakdownResponse {
  breakdown: ProgressBreakdown;
}
