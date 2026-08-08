import type { ScheduleEventMap } from '@memoflow/contracts/schedule';
import {
  createTaskScheduleProjectionEventHandlers,
  type TaskScheduleProjectionEventMap,
  type TaskScheduleProjectionSource,
} from '@memoflow/task/schedule-projection';
import type { IScheduleTaskRepository } from '@memoflow/schedule';
import type { Publisher, Subscriber } from '@memoflow/utils/domain';
import { createLogger } from '@memoflow/utils/logger';
import type { RuntimeContribution } from '../ports/runtime-contribution';
import { createTaskProjector } from '../projectors/task-projector';

const logger = createLogger('TaskProjectionRuntime');

export interface CreateTaskProjectionRuntimeDeps {
  readonly source: TaskScheduleProjectionSource;
  readonly scheduleTaskRepository: IScheduleTaskRepository;
  readonly taskEvents: Subscriber<TaskScheduleProjectionEventMap>;
  readonly scheduleEvents: Publisher<Pick<ScheduleEventMap, 'schedule:task-deleted'>>;
}

export function createTaskProjectionRuntime(
  deps: CreateTaskProjectionRuntimeDeps,
): RuntimeContribution {
  const projector = createTaskProjector({
    source: deps.source,
    scheduleTaskRepository: deps.scheduleTaskRepository,
    scheduleEvents: deps.scheduleEvents,
  });

  const handlers = createTaskScheduleProjectionEventHandlers(projector);
  let started = false;

  /**
   * R1-4：初次 reconcile —— 源支持全量扫描时，启动先对账（逐模板幂等
   * upsert），修复"只监听增量、错过启动前事件"的对账缺口（P0-02）。
   */
  async function reconcile(): Promise<void> {
    if (!deps.source.listTemplateRefs) {
      logger.warn('[TaskProjection] Source has no listTemplateRefs; skip initial reconcile');
      return;
    }
    const refs = await deps.source.listTemplateRefs();
    for (const ref of refs) {
      await projector.upsertTemplate(ref.templateId, ref.identityId);
    }
    logger.info(`[TaskProjection] Initial reconcile complete (${refs.length} templates)`);
  }

  return {
    async start(): Promise<void> {
      if (started) {
        return;
      }

      // R1-3/R1-4：先注册监听（启动窗口内的增量事件不会丢失），
      // 再全量对账。对账基于源表最新状态幂等重建，最终与源一致。
      deps.taskEvents.on('task:created', handlers['task:created']);
      deps.taskEvents.on('task:updated', handlers['task:updated']);
      deps.taskEvents.on('task:instance-generated', handlers['task:instance-generated']);
      deps.taskEvents.on(
        'task:template-schedule-time-changed',
        handlers['task:template-schedule-time-changed'],
      );
      deps.taskEvents.on(
        'task:template-recurrence-changed',
        handlers['task:template-recurrence-changed'],
      );
      deps.taskEvents.on('task:template-resumed', handlers['task:template-resumed']);
      deps.taskEvents.on('task:deleted', handlers['task:deleted']);
      deps.taskEvents.on('task:template-paused', handlers['task:template-paused']);
      deps.taskEvents.on('task:instance-completed', handlers['task:instance-completed']);
      deps.taskEvents.on('task:instance-skipped', handlers['task:instance-skipped']);
      deps.taskEvents.on('task:instance-deleted', handlers['task:instance-deleted']);

      await reconcile();

      started = true;
    },

    async stop(): Promise<void> {
      if (!started) {
        return;
      }

      deps.taskEvents.off('task:created', handlers['task:created']);
      deps.taskEvents.off('task:updated', handlers['task:updated']);
      deps.taskEvents.off('task:instance-generated', handlers['task:instance-generated']);
      deps.taskEvents.off(
        'task:template-schedule-time-changed',
        handlers['task:template-schedule-time-changed'],
      );
      deps.taskEvents.off(
        'task:template-recurrence-changed',
        handlers['task:template-recurrence-changed'],
      );
      deps.taskEvents.off('task:template-resumed', handlers['task:template-resumed']);
      deps.taskEvents.off('task:deleted', handlers['task:deleted']);
      deps.taskEvents.off('task:template-paused', handlers['task:template-paused']);
      deps.taskEvents.off('task:instance-completed', handlers['task:instance-completed']);
      deps.taskEvents.off('task:instance-skipped', handlers['task:instance-skipped']);
      deps.taskEvents.off('task:instance-deleted', handlers['task:instance-deleted']);

      started = false;
    },
  };
}
