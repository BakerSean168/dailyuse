import { randomUUID } from 'node:crypto';
import type { IScheduleRepository } from '../../domain/repositories/i-schedule-repository';
import { ScheduleConflictCacheService } from './schedule-conflict-cache-service';

export interface ProcessOutboxResult {
  processedCount: number;
  failedCount: number;
  leaseAcquired: boolean;
}

export interface ScheduleLeaseGuard {
  ensureHeld(): Promise<void>;
}

export interface ScheduleLeaseCoordinatorPort {
  execute<T>(
    leaseKey: string,
    task: (guard: ScheduleLeaseGuard) => Promise<T>,
  ): Promise<{ acquired: boolean; value?: T }>;
}

export interface ScheduleRebuildWorkerOptions {
  maxAttempts?: number;
  claimTimeoutMs?: number;
}

export class ScheduleRebuildWorkerService {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly leaseCoordinator: ScheduleLeaseCoordinatorPort,
    private readonly options: ScheduleRebuildWorkerOptions = {},
  ) {}

  async processOutbox(identityId?: string, limit = 50): Promise<ProcessOutboxResult> {
    const leaseKey = 'schedule-rebuild-worker';
    const execution = await this.leaseCoordinator.execute(leaseKey, async (guard) => {
      await guard.ensureHeld();
      const claimToken = randomUUID();
      const items = await this.scheduleRepository.claimRebuildOutboxItems(
        claimToken,
        limit,
        this.options.claimTimeoutMs ?? 30000,
      );

      if (items.length === 0) {
        return { processedCount: 0, failedCount: 0 };
      }

      const conflictCacheService = new ScheduleConflictCacheService(this.scheduleRepository);
      let processedCount = 0;
      let failedCount = 0;

      for (const item of items) {
        if (identityId && item.identityId !== identityId) continue;
        await guard.ensureHeld();
        try {
          await conflictCacheService.refreshForTimeRange(
            item.identityId,
            item.startTime.getTime(),
            item.endTime.getTime(),
            item.scheduleId ?? undefined,
            item.sourceRevision,
          );

          await guard.ensureHeld();
          await this.scheduleRepository.markRebuildOutboxProcessed(
            item.id,
            claimToken,
            undefined,
            this.options.maxAttempts ?? 5,
          );
          processedCount++;
        } catch (err: unknown) {
          const isLeaseLost =
            err instanceof Error &&
            (err.name === 'ScheduleLeaseLostError' ||
              err.message.toLowerCase().includes('lease ownership was lost'));
          if (isLeaseLost) {
            throw err;
          }
          const errorMessage = err instanceof Error ? err.message : 'Unknown worker error';
          await this.scheduleRepository.markRebuildOutboxProcessed(
            item.id,
            claimToken,
            errorMessage,
            this.options.maxAttempts ?? 5,
          );
          failedCount++;
        }
      }

      return { processedCount, failedCount };
    });

    if (!execution.acquired) {
      return { processedCount: 0, failedCount: 0, leaseAcquired: false };
    }

    return {
      ...(execution.value ?? { processedCount: 0, failedCount: 0 }),
      leaseAcquired: true,
    };
  }
}

export class ScheduleRebuildWorkerRuntime {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private activeProcess: Promise<unknown> | null = null;

  constructor(
    private readonly workerService: ScheduleRebuildWorkerService,
    private readonly intervalMs = 2000,
  ) {}

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    const poll = async () => {
      if (!this.running) return;
      try {
        this.activeProcess = this.workerService.processOutbox();
        await this.activeProcess;
      } catch (_err) {
        // Log background worker error silently
      } finally {
        this.activeProcess = null;
        if (this.running) {
          this.timer = setTimeout(poll, this.intervalMs);
          this.timer.unref?.();
        }
      }
    };

    void poll();
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.activeProcess) {
      await this.activeProcess.catch(() => undefined);
    }
  }
}
