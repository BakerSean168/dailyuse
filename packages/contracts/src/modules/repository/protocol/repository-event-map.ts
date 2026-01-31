// 定义 Repository 模块发出的事件
export type RepositoryEventMap = {
  // RepositoryStatistics 事件
  'repository-statistics:updated': { identityId: string; totalRepositories: number; totalResources: number; updatedAt: number };
};
