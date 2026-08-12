/**
 * ReminderSchedulerService - 提醒调度服务
 *
 * DDD Domain Service:
 * - 管理提醒的调度
 * - 批量处理待触发的提醒
 * - 协调触发服务和控制服务
 *
 * 职责：
 * - 扫描待触发的提醒
 * - 批量触发提醒
 * - 处理调度异常
 * - 定期更新统计数据
 */

import { randomUUID } from 'crypto';
import type { ReminderTemplate } from '../aggregates/reminder-template';
import type { IReminderTemplateRepository } from '../repositories/i-reminder-template-repository';
import type { ReminderTriggerService, ITriggerReminderResult } from './reminder-trigger-service';
import type { ReminderTemplateControlService } from './reminder-template-control-service';
import { TriggerResult } from '@memoflow/contracts/reminder';
import {
  buildIdempotencyKeyString,
  type BusinessOperationReceipt,
  type BusinessOperationStatus,
  type DeliveryAttempt,
  type LeaseClaim,
  type ReminderHeartbeatInput,
  type ReminderReliableOperationPort,
  type ReminderReplayDeadLetterInput,
} from '@memoflow/contracts/reliable-messaging';
import { createLogger } from '@memoflow/utils/logger';
import { ReminderMetricsCollector, globalReminderMetrics } from './reminder-metrics-service';
import type { ReminderTransactionRunner } from '../ports/reminder-transaction-runner.port';

const logger = createLogger('ReminderSchedulerService');

/**
 * 调度结果
 */
export interface IScheduleResult {
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failedCount: number;
  /** 跳过数量 */
  skippedCount: number;
  /** 总数 */
  totalCount: number;
  /** 详细结果 */
  details: ITriggerReminderResult[];
  /** 执行时长（毫秒） */
  duration: number;
}

/**
 * 调度选项
 */
export interface IScheduleOptions {
  /** 账户 ID（可选，不传则处理所有账户） */
  identityId?: string;
  /** 在此时间之前触发的提醒（默认当前时间） */
  beforeTime?: number;
  /** 最大处理数量（防止一次处理过多） */
  maxCount?: number;
  /** 并发数量（默认 10） */
  concurrency?: number;
  /** Worker/Scheduler 实例标识（用于 Lease Claim） */
  ownerToken?: string;
}

/**
 * ReminderSchedulerService
 */
export class ReminderSchedulerService {
  private readonly defaultOwnerToken: string;

  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly triggerService: ReminderTriggerService,
    private readonly reliablePort: ReminderReliableOperationPort,
    private readonly transactionRunner: ReminderTransactionRunner,
    private readonly controlService: ReminderTemplateControlService,
    private readonly metricsCollector: ReminderMetricsCollector = globalReminderMetrics,
    private readonly accountTimezonePort?: import('../ports/account-timezone.port').AccountTimezonePort,
  ) {
    if (
      !templateRepository ||
      !triggerService ||
      !reliablePort ||
      !transactionRunner ||
      !controlService
    ) {
      throw new Error(
        '[REMINDER_SCHEDULER] Mandatory dependencies missing: reliablePort, transactionRunner, and controlService are required. Fallback path is strictly forbidden.',
      );
    }
    this.defaultOwnerToken = `scheduler-${randomUUID()}`;
  }

  /**
   * 执行调度任务
   *
   * 扫描待触发的提醒并批量触发
   */
  async schedule(options: IScheduleOptions = {}): Promise<IScheduleResult> {
    const startTime = Date.now();
    const { identityId, beforeTime = Date.now(), maxCount = 100, concurrency = 10 } = options;

    logger.debug('Starting reminder schedule scan', { identityId, beforeTime });

    // 获取待触发的提醒
    const pendingReminders = await this.triggerService.getPendingReminders(beforeTime, identityId);

    // 限制数量
    const remindersToProcess = pendingReminders.slice(0, maxCount);
    const totalCount = remindersToProcess.length;

    if (totalCount > 0) {
      logger.info(`Found ${totalCount} pending reminders to process`, {
        ids: remindersToProcess.map((r) => r.id),
        titles: remindersToProcess.map((r) => r.title),
      });
    } else {
      logger.debug('No pending reminders found');
    }

    if (totalCount === 0) {
      return {
        successCount: 0,
        failedCount: 0,
        skippedCount: 0,
        totalCount: 0,
        details: [],
        duration: Date.now() - startTime,
      };
    }

    // 批量触发（控制并发）
    const results: ITriggerReminderResult[] = [];
    const ownerToken = options.ownerToken ?? this.defaultOwnerToken;

    for (let i = 0; i < remindersToProcess.length; i += concurrency) {
      const batch = remindersToProcess.slice(i, i + concurrency);
      const batchPromises = batch.map(async (template): Promise<ITriggerReminderResult> => {
        const triggerTime = template.getNextTriggerTime() ?? beforeTime;
        const rawTimeIso = new Date(triggerTime).toISOString();
        const occurrenceKey = `${template.id}:${rawTimeIso}`;
        const idempotencyKey = buildIdempotencyKeyString({
          identityId: template.identityId,
          source: 'reminder',
          occurrenceKey,
        });

        let claimResult:
          | {
              claimed: boolean;
              lease: LeaseClaim | null;
              receipt: BusinessOperationReceipt;
            }
          | undefined;

        try {
          claimResult = await this.reliablePort.claimOccurrence({
            identityId: template.identityId,
            source: 'reminder',
            templateId: template.id,
            occurrenceKey,
            ownerToken,
            leaseDurationMs: 30000,
            idempotencyKey,
          });

          if (!claimResult.claimed) {
            const isTerminal = ['succeeded', 'skipped', 'failed', 'cancelled'].includes(
              claimResult.receipt.status,
            );
            return {
              ok: isTerminal,
              result: TriggerResult.Skipped,
              triggerTime,
              nextTriggerTime: template.getNextTriggerTime(),
              message: isTerminal
                ? 'Duplicate claim (already processed)'
                : 'Lease claim rejected (held by active owner)',
            };
          }

          this.metricsCollector.recordPersisted();
          this.metricsCollector.recordClaimed();
          this.metricsCollector.recordDueLatency(Date.now() - triggerTime);

          let heartbeatTimer: NodeJS.Timeout | null = null;
          let heartbeatFailed = false;

          if (claimResult.lease && claimResult.lease.claimId) {
            const intervalMs = Math.max(50, claimResult.lease.heartbeatIntervalMs ?? 10000);
            heartbeatTimer = setInterval(async () => {
              try {
                const hbRes = await this.heartbeatLease({
                  identityId: template.identityId,
                  source: 'reminder',
                  templateId: template.id,
                  occurrenceKey,
                  ownerToken,
                  claimId: claimResult!.lease!.claimId,
                  fencingToken: claimResult!.lease!.fencingToken,
                  leaseDurationMs: 30000,
                });
                if (!hbRes.renewed) {
                  heartbeatFailed = true;
                  logger.warn('Heartbeat renewal failed: lease lost or preempted', {
                    templateId: template.id,
                    claimId: claimResult!.lease!.claimId,
                  });
                }
              } catch (err) {
                heartbeatFailed = true;
                logger.warn('Heartbeat error during occurrence processing', { error: err });
              }
            }, intervalMs);
          }

          try {
            const isEnabled = await this.controlService.isTemplateEffectivelyEnabled(template);

            if (heartbeatFailed) {
              throw new Error('Lease heartbeat failed or lease preempted before transaction execution.');
            }

            const receipt = await this.transactionRunner.executeClaimedOccurrenceTransaction({
              template,
              occurrence: {
                id: claimResult.receipt.operationId,
                identityId: template.identityId,
                templateId: template.id,
                occurrenceKey,
                idempotencyKey,
                fencingToken: claimResult.lease!.fencingToken,
                ownerToken,
              },
              isEnabled,
              skipReason: isEnabled ? undefined : '模板未启用或被分组禁用',
              triggerTime,
            });

            if (receipt.status === 'succeeded') {
              this.metricsCollector.recordSucceeded();
              return {
                ok: true,
                result: TriggerResult.Success,
                triggerTime,
                nextTriggerTime: template.getNextTriggerTime(),
                message: '触发成功',
                historyId: receipt.operationId,
              };
            } else {
              return {
                ok: true,
                result: TriggerResult.Skipped,
                triggerTime,
                nextTriggerTime: template.getNextTriggerTime(),
                message: '模板未启用或被分组禁用',
              };
            }
          } finally {
            if (heartbeatTimer) {
              clearInterval(heartbeatTimer);
            }
          }
        } catch (error) {
          return this.recordOccurrenceFailure({
            receipt: claimResult?.receipt,
            error,
            triggerTime,
            template,
          });
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // 统计结果
    const successCount = results.filter(
      (r) => r.result === TriggerResult.Success,
    ).length;
    const failedCount = results.filter(
      (r) => r.result === TriggerResult.Failed,
    ).length;
    const skippedCount = results.filter(
      (r) => r.result === TriggerResult.Skipped,
    ).length;

    logger.info('Reminder schedule scan completed', {
      successCount,
      failedCount,
      skippedCount,
      duration: Date.now() - startTime
    });

    if (successCount > 0) {
      this.metricsCollector.recordWorkerOutcome('completed');
    }
    if (failedCount > 0) {
      this.metricsCollector.recordWorkerOutcome('failed');
    }
    if (skippedCount > 0) {
      this.metricsCollector.recordWorkerOutcome('skipped');
    }

    return {
      successCount,
      failedCount,
      skippedCount,
      totalCount,
      details: results,
      duration: Date.now() - startTime,
    };
  }

  /**
   * 记录触发失败（重试 / 死信状态流转与指标记录）
   */
  async recordOccurrenceFailure(params: {
    receipt?: BusinessOperationReceipt;
    error: unknown;
    triggerTime?: number;
    template?: ReminderTemplate;
    maxRetries?: number;
  }): Promise<ITriggerReminderResult> {
    const { receipt, error, triggerTime = Date.now(), template, maxRetries = 3 } = params;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const attempt = receipt?.attempt ?? 1;
    const isDeadLetter = attempt >= maxRetries;
    const status: BusinessOperationStatus = isDeadLetter ? 'dead_letter' : 'retryable';

    // W7 互斥语义：失败分叉为 retryable/dead_letter，不再累计终态 outbox.failed
    if (isDeadLetter) {
      this.metricsCollector.recordDeadLetter();
    } else {
      this.metricsCollector.recordRetry();
    }

    if (receipt && this.reliablePort) {
      const nowIso = new Date().toISOString();
      const nextRetryAt = isDeadLetter
        ? null
        : new Date(Date.now() + 5000 * Math.pow(2, attempt - 1)).toISOString();
      const deadLetterAt = isDeadLetter ? nowIso : null;

      const existingHistory = receipt.attemptsHistory ?? [];
      const newAttemptEntry: DeliveryAttempt = {
        schemaVersion: 1,
        attempt,
        attemptedAt: nowIso,
        result: isDeadLetter ? 'failed' : 'retryable',
        error: errorMessage,
        durationMs: null,
        channel: null,
      };

      const failureReceipt: BusinessOperationReceipt = {
        ...receipt,
        status,
        attempt,
        lastError: errorMessage,
        nextRetryAt,
        deadLetterAt,
        lease: receipt.lease,
        attemptsHistory: [...existingHistory, newAttemptEntry],
        updatedAt: nowIso,
        finishedAt: null,
      };

      await this.reliablePort.recordDeliveryIntent(failureReceipt);
    }

    return {
      ok: false,
      result: TriggerResult.Failed,
      triggerTime,
      nextTriggerTime: template ? template.getNextTriggerTime() : null,
      message: errorMessage,
    };
  }

  /**
   * 续租 / 心跳 Lease
   */
  async heartbeatLease(input: ReminderHeartbeatInput): Promise<{
    renewed: boolean;
    lease: LeaseClaim | null;
    receipt: BusinessOperationReceipt;
  }> {
    return this.reliablePort.heartbeatLease(input);
  }

  /**
   * 查询死信队列
   */
  async queryDeadLetters(identityId: string): Promise<BusinessOperationReceipt[]> {
    return this.reliablePort.queryDeadLetters(identityId);
  }

  /**
   * 人工/运维 重发死信 Reminder occurrence
   */
  async replayDeadLetter(
    input: ReminderReplayDeadLetterInput,
  ): Promise<BusinessOperationReceipt> {
    return this.reliablePort.replayDeadLetter(input);
  }

  /**
   * 重新计算所有提醒的下次触发时间
   *
   * 用于修复数据或重新初始化
   */
  async recalculateAllNextTriggerTimes(identityId: string): Promise<number> {
    const templates = await this.templateRepository.findByIdentityId(identityId, {
      includeDeleted: false,
    });

    let updatedCount = 0;
    for (const template of templates) {
      const nextTriggerTime = template.calculateNextTrigger();
      if (template.getNextTriggerTime() !== nextTriggerTime) {
        // The internal state of `template` is updated by `calculateNextTrigger`.
        // We just need to save it.
        await this.templateRepository.save(template);
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * 获取即将触发的提醒（未来一段时间内）
   *
   * @param identityId 账户 ID
   * @param withinMinutes 未来多少分钟内（默认 60）
   */
  async getUpcomingReminders(
    identityId: string,
    withinMinutes: number = 60,
  ): Promise<ReminderTemplate[]> {
    const now = Date.now();
    const future = now + withinMinutes * 60 * 1000;

    const templates = await this.templateRepository.findByNextTriggerBefore(future, identityId);

    // 过滤出真正在未来时间范围内的（排除已过期的）
    return templates.filter((t) => {
      const nextTime = t.getNextTriggerTime();
      return nextTime && nextTime > now;
    });
  }

  /**
   * 获取过期未触发的提醒
   *
   * @param identityId 账户 ID
   * @param beforeMinutes 多少分钟前（默认 5）
   */
  async getOverdueReminders(
    identityId: string,
    beforeMinutes: number = 5,
  ): Promise<ReminderTemplate[]> {
    const now = Date.now();
    const past = now - beforeMinutes * 60 * 1000;

    return await this.templateRepository.findByNextTriggerBefore(past, identityId);
  }

  /**
   * 处理过期未触发的提醒
   *
   * @param identityId 账户 ID
   * @param action 处理动作：'trigger' 立即触发 | 'skip' 跳过并记录 | 'reschedule' 重新调度
   */
  async handleOverdueReminders(
    identityId: string,
    action: 'trigger' | 'skip' | 'reschedule' = 'skip',
  ): Promise<IScheduleResult> {
    const startTime = Date.now();
    const overdueReminders = await this.getOverdueReminders(identityId);

    if (overdueReminders.length === 0) {
      return {
        successCount: 0,
        failedCount: 0,
        skippedCount: 0,
        totalCount: 0,
        details: [],
        duration: Date.now() - startTime,
      };
    }

    const results: ITriggerReminderResult[] = [];

    switch (action) {
      case 'trigger':
        // 立即触发
        const triggerParams = overdueReminders.map((template) => ({
          template,
          reason: '过期补触发',
        }));
        const triggerResults = await this.triggerService.triggerRemindersBatch(triggerParams);
        results.push(...triggerResults);
        break;

      case 'skip':
        // 跳过并记录
        for (const template of overdueReminders) {
          await this.triggerService.recordTriggerSkipped(
            template,
            '过期跳过',
            template.getNextTriggerTime() || Date.now(),
          );

          // 计算下次触发时间
          const nextTriggerTime = template.calculateNextTrigger();
          await this.templateRepository.save(template);

          results.push({
            ok: true,
            result: TriggerResult.Skipped,
            triggerTime: template.getNextTriggerTime() || Date.now(),
            nextTriggerTime,
            message: '过期跳过',
          });
        }
        break;

      case 'reschedule':
        // 重新调度到下一个时间点
        for (const template of overdueReminders) {
          const nextTriggerTime = template.calculateNextTrigger();
          await this.templateRepository.save(template);

          results.push({
            ok: true,
            result: TriggerResult.Skipped,
            triggerTime: Date.now(),
            nextTriggerTime,
            message: '重新调度',
          });
        }
        break;
    }

    const successCount = results.filter(
      (r) => r.result === TriggerResult.Success,
    ).length;
    const failedCount = results.filter(
      (r) => r.result === TriggerResult.Failed,
    ).length;
    const skippedCount = results.filter(
      (r) => r.result === TriggerResult.Skipped,
    ).length;

    return {
      successCount,
      failedCount,
      skippedCount,
      totalCount: overdueReminders.length,
      details: results,
      duration: Date.now() - startTime,
    };
  }
}
