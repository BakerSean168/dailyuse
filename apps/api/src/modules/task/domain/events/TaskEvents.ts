/**
 * Task 模块领域事件定义
 * 用于模块间异步通信
 */

import type { IUnifiedEvent } from '@dailyuse/utils';

/**
 * 任务实例完成事件
 * 当任务实例被标记为完成时触发
 */
export interface TaskInstanceCompletedEvent extends IUnifiedEvent {
  eventType: 'task.instance.completed';
  payload: {
    taskInstanceUuid: string;
    taskTemplateUuid: string;
    title: string;
    completedAt: number;
    accountUuid: string;
    goalBinding?: {
      goalUuid: string;
      keyResultUuid: string;
      incrementValue: number;
    };
  };
}

/**
 * 任务模板创建事件
 * 当新的任务模板被创建时触发
 */
export interface TaskTemplateCreatedEvent extends IUnifiedEvent {
  eventType: 'task.template.created';
  payload: {
    taskTemplateUuid: string;
    title: string;
    accountUuid: string;
    createdAt: number;
  };
}

/**
 * 任务模板删除事件
 * 当任务模板被删除时触发
 */
export interface TaskTemplateDeletedEvent extends IUnifiedEvent {
  eventType: 'task.template.deleted';
  payload: {
    taskTemplateUuid: string;
    accountUuid: string;
    deletedAt: number;
  };
}

/**
 * Task 模块事件类型联合
 */
export type TaskModuleEvent =
  | TaskInstanceCompletedEvent
  | TaskTemplateCreatedEvent
  | TaskTemplateDeletedEvent;

/**
 * Task 模块事件类型常量
 */
export const TaskEventTypes = {
  INSTANCE_COMPLETED: 'task.instance.completed' as const,
  TEMPLATE_CREATED: 'task.template.created' as const,
  TEMPLATE_DELETED: 'task.template.deleted' as const,
} as const;
