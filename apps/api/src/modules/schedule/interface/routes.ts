/**
 * Schedule Routes Aggregator
 * 聚合所有日程相关的 HTTP 路由
 *
 * 模块化设计 - 按用例拆分:
 * - Core: 日程基础 CRUD
 * - Task: 任务管理和执行
 * - Conflict: 冲突检测和解决
 * - Event: 日程事件
 * - Statistics: 统计和分析
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { registerScheduleCoreRoutes } from './schedule-core.routes';
import { registerScheduleTaskRoutes } from './schedule-task.routes';
import { registerScheduleConflictRoutes } from './schedule-conflict.routes';
import { registerScheduleEventRoutes } from './schedule-event.routes';
import { registerScheduleStatisticsRoutes } from './schedule-statistics.routes';
import { ScheduleModule } from '@dailyuse/infrastructure-server';

export function registerScheduleRoutes(scheduleModule: ScheduleModule): Router {
  const router: Router = ExpressRouter();

  // ============ 日程核心路由 ============
  // POST   /api/schedules              - 创建日程
  // GET    /api/schedules              - 获取日程列表
  // GET    /api/schedules/:id          - 获取日程详情
  // PUT    /api/schedules/:id          - 更新日程
  // DELETE /api/schedules/:id          - 删除日程
  // GET    /api/schedules/:id/tasks    - 获取日程任务
  router.use('/', registerScheduleCoreRoutes(scheduleModule.scheduleService, scheduleModule.scheduleEventService));

  // ============ 日程任务路由 ============
  // POST   /api/schedules/tasks                    - 创建任务
  // GET    /api/schedules/tasks                    - 获取任务列表
  // GET    /api/schedules/tasks/:id                - 获取任务详情
  // PUT    /api/schedules/tasks/:id                - 更新任务
  // DELETE /api/schedules/tasks/:id                - 删除任务
  // PATCH  /api/schedules/tasks/:id/pause          - 暂停任务
  // PATCH  /api/schedules/tasks/:id/resume         - 恢复任务
  // POST   /api/schedules/tasks/:id/complete       - 完成任务
  // POST   /api/schedules/tasks/:id/cancel         - 取消任务
  router.use('/tasks', registerScheduleTaskRoutes(scheduleModule.scheduleService));

  // ============ 日程冲突检测路由 ============
  // POST   /api/schedules/conflicts/detect         - 检测冲突
  // GET    /api/schedules/conflicts                - 获取冲突列表
  // POST   /api/schedules/conflicts/:id/resolve    - 解决冲突
  // POST   /api/schedules/conflicts/batch-resolve  - 批量解决冲突
  router.use('/conflicts', registerScheduleConflictRoutes());

  // ============ 日程事件路由 ============
  // 用户视角的日历事件管理
  router.use('/events', registerScheduleEventRoutes(scheduleModule.scheduleEventService));

  // ============ 日程统计路由 ============
  // 统计和分析
  router.use('/statistics', registerScheduleStatisticsRoutes(scheduleModule.scheduleStatisticsService));

  return router;
}
