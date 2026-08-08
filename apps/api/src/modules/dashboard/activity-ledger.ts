/**
 * R6：Activity Ledger 记录器（API 宿主）。
 *
 * 订阅各模块关键事件，把业务活动写入 durable ledger，供 Dashboard 读模型
 * 以窗口查询解释"每次 Goal/KR 变化来自哪里"，而不是全量加载后内存拼接。
 *
 * 订阅集合保持克制（只记录可解释的变化）：
 * - goal:created / goal:completed / goal:review-added
 * - task:instance-completed / task:instance-uncompleted
 * - reminder:response-recorded
 * - schedule:task-executed
 */

import { createTypedEventSubscriber, eventBus } from '@memoflow/utils/domain';
import type { AppEventRegistry } from '@memoflow/contracts/shared';
import { createLogger } from '@memoflow/utils/logger';
import type { PrismaClient } from '@memoflow/database';

const logger = createLogger('ActivityLedger');

export interface ActivityEntry {
  identityId: string;
  actorId: string;
  subjectType: string;
  subjectId: string;
  action: string;
  title?: string | null;
  correlationId?: string | null;
  beforeSummary?: string | null;
  afterSummary?: string | null;
  sourceEvent: string;
  occurredAt: number;
}

export interface IActivityLedgerWriter {
  append(entry: ActivityEntry): Promise<void>;
}

export class PrismaActivityLedgerWriter implements IActivityLedgerWriter {
  constructor(private readonly db: PrismaClient) {}

  async append(entry: ActivityEntry): Promise<void> {
    await this.db.activityLedger.create({
      data: {
        id: crypto.randomUUID(),
        identityId: entry.identityId,
        actorId: entry.actorId,
        subjectType: entry.subjectType,
        subjectId: entry.subjectId,
        action: entry.action,
        title: entry.title ?? null,
        correlationId: entry.correlationId ?? null,
        beforeSummary: entry.beforeSummary ?? null,
        afterSummary: entry.afterSummary ?? null,
        sourceEvent: entry.sourceEvent,
        occurredAt: new Date(entry.occurredAt),
      },
    });
  }
}

export function createActivityLedgerRecorder(
  writer: IActivityLedgerWriter,
): { start(): void; stop(): void } {
  // 记录器是基础设施：订阅各模块事件（宽松 payload，按需解构），
  // 写入失败不影响业务主链路。
  type Handler = (payload: Record<string, unknown>) => void;
  type LedgerEventName =
    | 'goal:created'
    | 'goal:completed'
    | 'goal:review-added'
    | 'task:instance-completed'
    | 'task:instance-uncompleted'
    | 'reminder:response-recorded'
    | 'schedule:task-executed';
  const events = createTypedEventSubscriber<
    Pick<
      AppEventRegistry,
      | 'goal:created'
      | 'goal:completed'
      | 'goal:review-added'
      | 'task:instance-completed'
      | 'task:instance-uncompleted'
      | 'reminder:response-recorded'
      | 'schedule:task-executed'
    >
  >(eventBus);
  const handlers = new Map<string, (payload: unknown) => void>();

  const safeAppend = async (entry: ActivityEntry): Promise<void> => {
    try {
      await writer.append(entry);
    } catch (error) {
      // Ledger 写入失败不影响业务主链路。
      logger.error('[ActivityLedger] append failed', {
        sourceEvent: entry.sourceEvent,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const subscribe = (eventName: LedgerEventName, handler: Handler): void => {
    const wrapped = (payload: unknown): void => {
      handler((payload ?? {}) as Record<string, unknown>);
    };
    events.on(eventName, wrapped);
    handlers.set(eventName, wrapped);
  };

  let started = false;

  return {
    start(): void {
      if (started) return;
      started = true;

      subscribe('goal:created', (e) =>
        void safeAppend({
          identityId: String(e.identityId ?? ''),
          actorId: String(e.identityId ?? ''),
          subjectType: 'goal',
          subjectId: String((e.goal as Record<string, unknown>)?.id ?? ''),
          action: 'created',
          title: String((e.goal as Record<string, unknown>)?.name ?? ''),
          sourceEvent: 'goal:created',
          occurredAt: Date.now(),
        }),
      );
      subscribe('goal:completed', (e) =>
        void safeAppend({
          identityId: String(e.identityId ?? ''),
          actorId: String(e.identityId ?? ''),
          subjectType: 'goal',
          subjectId: String((e.goal as Record<string, unknown>)?.id ?? ''),
          action: 'completed',
          title: String((e.goal as Record<string, unknown>)?.name ?? ''),
          sourceEvent: 'goal:completed',
          occurredAt: Date.now(),
        }),
      );
      subscribe('goal:review-added', (e) =>
        void safeAppend({
          identityId: String(e.identityId ?? ''),
          actorId: String(e.identityId ?? ''),
          subjectType: 'goal',
          subjectId: String((e.goal as Record<string, unknown>)?.id ?? ''),
          action: 'review-added',
          title: String((e.goal as Record<string, unknown>)?.name ?? ''),
          sourceEvent: 'goal:review-added',
          occurredAt: Date.now(),
        }),
      );
      subscribe('task:instance-completed', (e) =>
        void safeAppend({
          identityId: String(e.identityId ?? ''),
          actorId: String(e.identityId ?? ''),
          subjectType: 'task',
          subjectId: String(e.taskInstanceId ?? ''),
          action: 'completed',
          title: e.taskTitle != null ? String(e.taskTitle) : null,
          sourceEvent: 'task:instance-completed',
          occurredAt: Date.now(),
        }),
      );
      subscribe('task:instance-uncompleted', (e) =>
        void safeAppend({
          identityId: String(e.identityId ?? ''),
          actorId: String(e.identityId ?? ''),
          subjectType: 'task',
          subjectId: String(e.taskInstanceId ?? ''),
          action: 'uncompleted',
          title: e.taskTitle != null ? String(e.taskTitle) : null,
          sourceEvent: 'task:instance-uncompleted',
          occurredAt: Date.now(),
        }),
      );
      subscribe('reminder:response-recorded', (e) =>
        void safeAppend({
          identityId: String(e.identityId ?? ''),
          actorId: String(e.identityId ?? ''),
          subjectType: 'reminder',
          subjectId: String(e.responseId ?? ''),
          action: `response:${String(e.action ?? '').toLowerCase()}`,
          title: e.templateId != null ? String(e.templateId) : null,
          sourceEvent: 'reminder:response-recorded',
          occurredAt: typeof e.recordedAt === 'number' ? e.recordedAt : Date.now(),
        }),
      );
      subscribe('schedule:task-executed', (e) =>
        void safeAppend({
          identityId: String(e.identityId ?? ''),
          actorId: String(e.identityId ?? ''),
          subjectType: 'schedule',
          subjectId: String(e.taskId ?? ''),
          action: 'executed',
          title: e.taskName != null ? String(e.taskName) : null,
          sourceEvent: 'schedule:task-executed',
          occurredAt: typeof e.executedAt === 'number' ? e.executedAt : Date.now(),
        }),
      );
      logger.info('[ActivityLedger] Recorder started');
    },

    stop(): void {
      if (!started) return;
      started = false;
      for (const [eventName, wrapped] of handlers) {
        events.off(eventName as LedgerEventName, wrapped);
      }
      handlers.clear();
      logger.info('[ActivityLedger] Recorder stopped');
    },
  };
}
