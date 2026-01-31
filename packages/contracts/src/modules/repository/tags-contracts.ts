/**
 * Story 11.5: 标签统计与过滤
 * 
 * Tag 相关的数据传输对象定义
 */

/**
 * 标签统计信息
 */
export interface TagStatisticsDto {
  /** 标签名称 */
  tag: string;
  
  /** 使用该标签的资源数量 */
  count: number;
  
  /** 使用该标签的资源列表 */
  resources: TagResourceReferenceDto[];
}

/**
 * 标签关联的资源引用
 */
export interface TagResourceReferenceDto {
  /** 资源 UUID */
  uuid: string;
  
  /** 资源标题 */
  title: string;
  
  /** 资源路径 */
  path: string;
  
  /** 更新时间 */
  updatedAt: string;
}
