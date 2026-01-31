// 定义 Account 模块发出的事件
export type AccountEventMap = {
  'account:created': { email: string; createdAt: number };
  'account:closed': { reason: string };
  'account:profile-updated': { updatedFields: string[] };
};
