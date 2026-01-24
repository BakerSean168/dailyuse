/**
 * Schedule Monitor
 * 璋冨害鐩戞帶
 *
 * 鑱岃矗锟?
 * - 鐩戞帶瀹氭椂浠诲姟鎵ц鐘讹拷?
 * - 璁板綍浠诲姟鎵ц鏃堕棿鍜岀粨锟?
 * - 鎻愪緵鎬ц兘鎸囨爣鏀堕泦
 *
 * @module Schedule/Infrastructure/Monitoring
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleMonitor');

interface TaskExecutionMetrics {
  taskUuid: string;
  executedAt: number;
  duration: number;
  success: boolean;
  error?: Error;
}

/**
 * 璋冨害鐩戞帶锟?
 */
export class ScheduleMonitor {
  private static instance: ScheduleMonitor;
  private executionMetrics: TaskExecutionMetrics[] = [];
  private readonly maxMetrics = 1000; // 鏈€澶氫繚锟?1000 鏉¤锟?

  private constructor() {}

  public static getInstance(): ScheduleMonitor {
    if (!ScheduleMonitor.instance) {
      ScheduleMonitor.instance = new ScheduleMonitor();
    }
    return ScheduleMonitor.instance;
  }

  /**
   * 璁板綍浠诲姟鎵ц
   */
  recordExecution(metrics: TaskExecutionMetrics): void {
    this.executionMetrics.push(metrics);

    // 淇濇寔鍐呭瓨涓殑鎸囨爣鏁伴噺鍦ㄥ彲鎺ц寖锟?
    if (this.executionMetrics.length > this.maxMetrics) {
      this.executionMetrics.shift();
    }

    if (metrics.success) {
      logger.info(`Task ${metrics.taskUuid} executed successfully in ${metrics.duration}ms`);
    } else {
      logger.error(
        `Task ${metrics.taskUuid} failed after ${metrics.duration}ms`,
        metrics.error,
      );
    }
  }

  /**
   * 鑾峰彇浠诲姟鐨勬墽琛屽巻锟?
   */
  getTaskHistory(taskUuid: string, limit: number = 10): TaskExecutionMetrics[] {
    return this.executionMetrics
      .filter((m) => m.taskUuid === taskUuid)
      .slice(-limit);
  }

  /**
   * 鑾峰彇鏈€杩戞墽琛岀殑浠诲姟
   */
  getRecentExecutions(limit: number = 10): TaskExecutionMetrics[] {
    return this.executionMetrics.slice(-limit);
  }

  /**
   * 鑾峰彇鎵ц鎴愬姛锟?
   */
  getSuccessRate(): number {
    if (this.executionMetrics.length === 0) return 0;
    const successful = this.executionMetrics.filter((m) => m.success).length;
    return (successful / this.executionMetrics.length) * 100;
  }

  /**
   * 娓呯┖鎸囨爣
   */
  clearMetrics(): void {
    this.executionMetrics = [];
  }
}
