/**
 * Task Dependency Requests
 * 任务依赖请求类型定义
 */

/**
 * 获取依赖链请求
 */
export interface GetDependencyChainRequest {
  taskUuid: string;
  maxDepth?: number; // 最大深度（防止循环依赖导致无限查询）
}
