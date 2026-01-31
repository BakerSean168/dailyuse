// 定义 AI 模块发出的事件
export type AIEventMap = {
  // AIUsageQuota 事件
  'ai-quota:created': { quotaId: string; identityId: string; quotaLimit: number };
  'ai-quota:consumed': { quotaId: string; identityId: string; amount: number; previousUsage: number; newUsage: number };
  'ai-quota:reset': { quotaId: string; identityId: string; previousUsage: number; resetAt: number; nextResetAt: number };
  'ai-quota:exceeded': { quotaId: string; identityId: string; quotaLimit: number; currentUsage: number };
  'ai-quota:limit-updated': { quotaId: string; previousLimit: number; newLimit: number };
};
