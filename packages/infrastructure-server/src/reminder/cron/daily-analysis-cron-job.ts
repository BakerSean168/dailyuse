import {
  SmartFrequencyAnalysisService,
  FrequencyAdjustmentService,
} from '@dailyuse/application-server';
import { ReminderContainer } from '../di/ReminderContainer';
import { isDevelopment } from '../../shared/config/env';

/**
 * 姣忔棩鍒嗘瀽 Cron Job
 *
 * 鎵ц鏃堕棿锛氭瘡澶╁噷锟?2:00
 * Cron 琛ㄨ揪寮忥細0 2 * * *
 *
 * 鑱岃矗锟?
 * - 鍒嗘瀽All鏈夎处鎴风殑鎻愰啋鏁堟灉
 * - 鑷姩璋冩暣浣庢晥鎻愰啋鐨勯锟?
 * - 鐢熸垚鍒嗘瀽鎶ュ憡
 */
export class DailyAnalysisCronJob {
  private analysisService!: SmartFrequencyAnalysisService;
  private adjustmentService!: FrequencyAdjustmentService;

  /**
   * 鍒濆鍖栨湇锟?
   */
  private async initialize(): Promise<void> {
    this.analysisService = await SmartFrequencyAnalysisService.getInstance();
    this.adjustmentService = await FrequencyAdjustmentService.getInstance();
  }

  /**
   * 鎵ц姣忔棩鍒嗘瀽浠诲姟
   */
  async execute(): Promise<void> {
    console.log('[DailyAnalysisCronJob] Starting daily analysis...');
    const startTime = Date.now();

    try {
      await this.initialize();

      // GetAll鏈夋椿璺冭处锟?
      const accountUuids = await this.getAllActiveAccounts();
      console.log(`[DailyAnalysisCronJob] Found ${accountUuids.length} active accounts`);

      // 鍒嗘瀽缁撴灉缁熻
      let totalTemplatesAnalyzed = 0;
      let totalAdjustmentsMade = 0;
      const failedAccounts: string[] = [];

      // 閫愪釜鍒嗘瀽璐︽埛
      for (const accountUuid of accountUuids) {
        try {
          const result = await this.analyzeAccount(accountUuid);
          totalTemplatesAnalyzed += result.templatesAnalyzed;
          totalAdjustmentsMade += result.adjustmentsMade;
        } catch (error) {
          console.error(`[DailyAnalysisCronJob] Failed to analyze account ${accountUuid}:`, error);
          failedAccounts.push(accountUuid);
        }
      }

      const duration = Date.now() - startTime;
      console.log('[DailyAnalysisCronJob] Daily analysis completed:', {
        duration: `${(duration / 1000).toFixed(2)}s`,
        totalAccounts: accountUuids.length,
        totalTemplatesAnalyzed,
        totalAdjustmentsMade,
        failedAccounts: failedAccounts.length,
      });

      // Save鍒嗘瀽鎶ュ憡
      await this.saveAnalysisReport({
        executedAt: startTime,
        duration,
        totalAccounts: accountUuids.length,
        totalTemplatesAnalyzed,
        totalAdjustmentsMade,
        failedAccounts,
      });
    } catch (error) {
      console.error('[DailyAnalysisCronJob] Fatal error during daily analysis:', error);
      throw error;
    }
  }

  /**
   * 鍒嗘瀽鍗曚釜璐︽埛
   */
  private async analyzeAccount(
    accountUuid: string,
  ): Promise<{ templatesAnalyzed: number; adjustmentsMade: number }> {
    console.log(`[DailyAnalysisCronJob] Analyzing account ${accountUuid}...`);

    // 1. 鐢熸垚鏁堟灉鍒嗘瀽鎶ュ憡
    const report = await this.analysisService.analyzeAllTemplates(accountUuid);

    // 2. 鑷姩璋冩暣浣庢晥鎻愰啋
    const adjustments = await this.adjustmentService.batchAutoAdjust(accountUuid);

    console.log(`[DailyAnalysisCronJob] Account ${accountUuid} analyzed:`, {
      totalTemplates: report.totalTemplates,
      avgClickRate: `${report.avgClickRate.toFixed(2)}%`,
      avgEffectiveness: report.avgEffectivenessScore.toFixed(2),
      lowEffectiveCount: report.lowEffective.length,
      adjustmentsMade: adjustments.length,
    });

    return {
      templatesAnalyzed: report.totalTemplates,
      adjustmentsMade: adjustments.length,
    };
  }

  /**
   * GetAll鏈夋椿璺冭处锟?
   *
   * 瀹氫箟锛氭渶锟?0澶╁唴鏈夎嚦灏戜竴涓椿璺冩彁閱掓ā鏉跨殑璐︽埛
   */
  private async getAllActiveAccounts(): Promise<string[]> {
    const container = ReminderContainer.getInstance();
    const prisma = container.getPrismaClient();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 鏌ヨ鏈€锟?0澶╁唴鏈夋椿璺冩ā鏉跨殑璐︽埛
    const accounts = await prisma.reminderTemplate.findMany({
      where: {
        selfEnabled: true,
        status: 'active',
        // TODO: Need瑕佽繍锟?Prisma migration 鍚庢墠鑳戒娇锟?smartFrequencyEnabled
        // smartFrequencyEnabled: true,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        accountUuid: true,
      },
      distinct: ['accountUuid'],
    });

    return accounts.map((a) => a.accountUuid);
  }

  /**
   * Save鍒嗘瀽鎶ュ憡
   *
   * TODO: 瀹炵幇鎶ュ憡鎸佷箙锟?
   * 鍙互閫夋嫨锟?
   * - Save鍒版暟鎹簱
   * - Save鍒版枃浠剁郴锟?
   * - 鍙戦€佸埌鐩戞帶绯荤粺
   */
  private async saveAnalysisReport(report: {
    executedAt: number;
    duration: number;
    totalAccounts: number;
    totalTemplatesAnalyzed: number;
    totalAdjustmentsMade: number;
    failedAccounts: string[];
  }): Promise<void> {
    // TODO: 鎸佷箙鍖栨姤锟?
    console.log('[DailyAnalysisCronJob] Analysis report:', report);
  }
}

/**
 * Cron Job 娉ㄥ唽鍑芥暟
 *
 * 浣跨敤 node-cron 鎴栧叾浠栬皟搴﹀櫒娉ㄥ唽姝や换锟?
 *
 * @example
 * ```typescript
 * import cron from 'node-cron';
 *
 * // 姣忓ぉ鍑屾櫒 2:00 鎵ц
 * cron.schedule('0 2 * * *', async () => {
 *   const job = new DailyAnalysisCronJob();
 *   await job.execute();
 * });
 * ```
 */
export async function registerDailyAnalysisCronJob(): Promise<void> {
  const job = new DailyAnalysisCronJob();

  // TODO: 浣跨敤瀹為檯锟?cron 璋冨害锟?
  // 渚嬪锛歯ode-cron, bull, agenda 锟?
  console.log('[DailyAnalysisCronJob] Registered (schedule: 0 2 * * *)');

  // 寮€鍙戠幆澧冨彲浠ユ墜鍔ㄨЕ鍙戞祴锟?
  if (isDevelopment) {
    console.log('[DailyAnalysisCronJob] Development mode - execute manually with: job.execute()');
  }
}
