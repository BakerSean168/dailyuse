export interface TaskEventMap {
  // ================= Template Events (元数据变更) =================
  'task:template-created': {
    templateId: string;
    identityId: string;
    linkedKeyResultId?: string; // 如果关联了 OKR
  };
  'task:template-updated': {
    templateId: string;

  };
  'task:template-deleted': {
    templateId: string;
  };

  // ================= Instance Events (执行状态变更 - 核心) =================
  
  // 1. 生成了新的待办实例 (Schedule 模块可能会监听这个来排程)
  'task:instance-created': {
    instanceId: string;
    templateId: string;
    date: string; // ISO Date
    scheduledTime: { start: string; end?: string } | null;
  };

  // 2. 任务完成 (Goal 模块监听这个来增加 KeyResult 进度!)
  'task:instance-completed': {
    instanceId: string;
    templateId: string;
    identityId: string;
    completedAt: string;
    linkedKeyResultId?: string; // 方便 Goal 模块快速过滤
    impactValue?: number;       // 贡献值
  };

  // 3. 任务取消完成 (误操作回滚，Goal 模块需要扣减进度)
  'task:instance-uncompleted': {
    instanceId: string;
    linkedKeyResultId?: string;
  };

  // 4. 任务被推迟/重排 (Schedule 模块更新日历)
  'task:instance-rescheduled': {
    instanceId: string;
    originalDate: string;
    newDate: string;
  };
}