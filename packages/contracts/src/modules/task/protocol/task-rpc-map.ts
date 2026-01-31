import type { CreateTaskReq, UpdateTaskReq, RescheduleTaskReq } from '../api';

import type { TaskTemplateClientDTO, TaskInstanceClientDTO  } from '../aggregates';

export interface TaskRpcMap {
  // === Commands (写操作) ===
  
  // 创建任务 (内部会同时创建 Template 和当天的 Instance)
  'task.create': {
    req: CreateTaskReq;
    res: { template: TaskTemplateClientDTO; instance: TaskInstanceClientDTO };
  };

  // 仅仅更新内容 (标题、描述)
  'task.update-content': {
    req: UpdateTaskReq;
    res: void;
  };

  // 打勾完成
  'task.complete': {
    req: { instanceId: string };
    res: void;
  };

  // 取消完成
  'task.uncomplete': {
    req: { instanceId: string };
    res: void;
  };

  // 拖拽重排 (修改时间)
  'task.reschedule': {
    req: RescheduleTaskReq;
    res: { instanceId: string; newTime: any };
  };

  // === Queries (读操作) ===

  // 获取某时间范围内的所有实例 (日历视图用)
  'task.get-instances-by-range': {
    req: { startDate: string; endDate: string };
    res: TaskInstanceClientDTO[];
  };

  // 获取当天的待办 (Todo 视图用)
  'task.get-today-todo': {
    req: void;
    res: TaskInstanceClientDTO[];
  };
}