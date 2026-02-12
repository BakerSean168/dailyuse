/**
 * Task Events
 *
 * 任务模块事件常量
 */

export const TaskEvents = {
  TEMPLATE_CREATED: 'task:template:created',
  TEMPLATE_UPDATED: 'task:template:updated',
  TEMPLATE_DELETED: 'task:template:deleted',
  TEMPLATE_ACTIVATED: 'task:template:activated',
  TEMPLATE_PAUSED: 'task:template:paused',
  TEMPLATE_ARCHIVED: 'task:template:archived',
  INSTANCES_GENERATED: 'task:instances:generated',
  BOUND_TO_GOAL: 'task:template:bound-to-goal',
  UNBOUND_FROM_GOAL: 'task:template:unbound-from-goal',
} as const;

export const TaskInstanceEvents = {
  INSTANCE_STARTED: 'task:instance:started',
  INSTANCE_COMPLETED: 'task:instance:completed',
  INSTANCE_SKIPPED: 'task:instance:skipped',
  INSTANCE_DELETED: 'task:instance:deleted',
  INSTANCES_EXPIRED: 'task:instances:expired',
  EXPIRED_CHECKED: 'task:instance:expired-checked',
} as const;

export interface TaskTemplateRefreshEvent {
  templateUuid: string;
  reason: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface TaskInstanceRefreshEvent {
  instanceUuid: string;
  templateUuid?: string;
  reason: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
