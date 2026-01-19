import type { IReminderTemplateRepository } from '@dailyuse/domain-server/reminder';
import { ResponseMetrics } from '@dailyuse/domain-server/reminder';
import type { PrismaClient } from '@prisma/client';
import { ReminderContainer } from '@dailyuse/infrastructure-server';

/**
 * 响应行为类型
 */
type ResponseAction = 'clicked' | 'ignored' | 'snoozed' | 'dismissed' | 'completed';

/**
 * 响应记录接口
 */
interface ReminderResponseRecord {
  action: ResponseAction;
  responseTime: number | null; // 响应时间(秒)
  timestamp: bigint;
}

/**
 * 效果分析报告
 */
export interface EffectivenessReport {
  templateId: string;
  clickRate: number;
  ignoreRate: number;
  avgResponseTime: number;
  effectivenessScore: number;
  sampleSize: number;
  recommendation: 'decrease' | 'increase' | 'no_change';
}

/**
 * 全局分析报告
 */
export interface GlobalAnalysisReport {
  accountUuid: string;
  totalTemplates: number;
  avgClickRate: number;
  avgEffectivenessScore: number;
  highEffective: EffectivenessReport[];
  lowEffective: EffectivenessReport[];
  analyzedAt: number;
}

/**
 * Smart Frequency Analysis Service
 * 
 * 职责：
 * - 分析用户对提醒的响应模式
 * - 计算效果评分
 * - 生成频率调整建议
 */
export class SmartFrequencyAnalysisService {
  private static instance: SmartFrequencyAnalysisService;

  private constructor(
    private reminderTemplateRepository: IReminderTemplateRepository,
    private prisma: PrismaClient,
  ) {}

  /**
   * 创建服务实例
   */
  static async createInstance(
    reminderTemplateRepository?: IReminderTemplateRepository,
    prisma?: PrismaClient,
  ): Promise<SmartFrequencyAnalysisService> {
    const container = ReminderContainer.getInstance();
    const templateRepo = reminderTemplateRepository || container.getReminderTemplateRepository();
    const prismaClient = prisma || container.getPrismaClient();

    SmartFrequencyAnalysisService.instance = new SmartFrequencyAnalysisService(
      templateRepo,
      prismaClient,
    );
    return SmartFrequencyAnalysisService.instance;
  }

  /**
   * 获取服务单例
   */
  static async getInstance(): Promise<SmartFrequencyAnalysisService> {
    if (!SmartFrequencyAnalysisService.instance) {
      SmartFrequencyAnalysisService.instance = await SmartFrequencyAnalysisService.createInstance();
    }
    return SmartFrequencyAnalysisService.instance;
  }

  /**
   * 分析单个提醒模板的效果
   * 
   * @param templateId - 提醒模板ID
   * @param lookbackDays - 回溯天数，默认30天
   * @returns 响应指标或null（数据不足时）
   */
  async analyzeTemplate(
    templateId: string,
    lookbackDays: number = 30,
  ): Promise<ResponseMetrics | null> {
    // 1. 获取提醒模板
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 检查是否启用智能频率
    if (!template.smartFrequencyEnabled) {
      return null;
    }

    // 2. 获取最近N天的响应记录
    const cutoffTime = BigInt(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
    
    // TODO: 需要运行 Prisma migration 后才能使用 reminderResponse
    // @ts-ignore - reminderResponse 表还未创建,需要运行 migration
    const responses = await this.prisma.reminderResponse.findMany({
      where: {
        templateUuid: templateId,
        timestamp: {
          gte: cutoffTime,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    }) as ReminderResponseRecord[];

    // 3. 数据不足，无法分析
    if (responses.length < 10) {
      return null;
    }

    // 4. 计算指标
    const metrics = this.calculateMetrics(responses);

    // 5. 创建 ResponseMetrics 值对象 (effectivenessScore 会自动计算)
    const responseMetrics = ResponseMetrics.create({
      clickRate: metrics.clickRate,
      ignoreRate: metrics.ignoreRate,
      avgResponseTime: metrics.avgResponseTime,
      snoozeCount: metrics.snoozeCount,
      sampleSize: responses.length,
    });

    // 6. 更新模板的响应指标
    template.updateResponseMetrics(responseMetrics.toServerDTO());
    await this.reminderTemplateRepository.save(template);

    return responseMetrics;
  }

  /**
   * 分析账户下所有活跃模板
   * 
   * @param accountUuid - 账户ID
   * @returns 全局分析报告
   */
  async analyzeAllTemplates(accountUuid: string): Promise<GlobalAnalysisReport> {
    // 1. 获取所有活跃的提醒模板
    const templates = await this.reminderTemplateRepository.findActive(accountUuid);

    // 2. 分析每个模板
    const reports: EffectivenessReport[] = [];
    for (const template of templates) {
      try {
        const metrics = await this.analyzeTemplate(template.uuid);
        if (metrics) {
          const recommendation = this.shouldAdjustFrequency(
            metrics.effectivenessScore,
            metrics.ignoreRate,
            metrics.sampleSize,
          );

          reports.push({
            templateId: template.uuid,
            clickRate: metrics.clickRate,
            ignoreRate: metrics.ignoreRate,
            avgResponseTime: metrics.avgResponseTime,
            effectivenessScore: metrics.effectivenessScore,
            sampleSize: metrics.sampleSize,
            recommendation,
          });
        }
      } catch (error) {
        console.error(`Failed to analyze template ${template.uuid}:`, error);
        // 继续分析其他模板
      }
    }

    // 3. 计算全局指标
    const avgClickRate =
      reports.reduce((sum, r) => sum + r.clickRate, 0) / (reports.length || 1);
    const avgEffectivenessScore =
      reports.reduce((sum, r) => sum + r.effectivenessScore, 0) / (reports.length || 1);

    // 4. 分类高效和低效提醒
    const highEffective = reports.filter((r) => r.effectivenessScore >= 70);
    const lowEffective = reports.filter((r) => r.effectivenessScore < 40);

    return {
      accountUuid,
      totalTemplates: templates.length,
      avgClickRate,
      avgEffectivenessScore,
      highEffective,
      lowEffective,
      analyzedAt: Date.now(),
    };
  }

  /**
   * 计算响应指标
   * 
   * @private
   */
  private calculateMetrics(responses: ReminderResponseRecord[]): {
    clickRate: number;
    ignoreRate: number;
    avgResponseTime: number;
    snoozeCount: number;
    effectivenessScore: number;
  } {
    const total = responses.length;
    const clickedCount = responses.filter((r) => r.action === 'clicked' || r.action === 'completed').length;
    const ignoredCount = responses.filter((r) => r.action === 'ignored').length;
    const snoozeCount = responses.filter((r) => r.action === 'snoozed').length;

    // 计算响应时间（只统计有响应时间的记录）
    const responseTimes = responses
      .filter((r) => r.responseTime !== null)
      .map((r) => r.responseTime as number);
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 300; // 默认5分钟

    // 计算比率
    const clickRate = (clickedCount / total) * 100;
    const ignoreRate = (ignoredCount / total) * 100;

    // 计算效果评分
    const effectivenessScore = this.calculateEffectivenessScore(
      clickRate,
      ignoreRate,
      avgResponseTime,
    );

    return {
      clickRate,
      ignoreRate,
      avgResponseTime,
      snoozeCount,
      effectivenessScore,
    };
  }

  /**
   * 计算效果评分
   * 
   * 公式: (clickRate × 0.5) + ((100 - ignoreRate) × 0.3) + (responsiveness × 0.2)
   * 
   * @private
   */
  private calculateEffectivenessScore(
    clickRate: number,
    ignoreRate: number,
    avgResponseTime: number,
  ): number {
    const clickWeight = 0.5;
    const ignoreWeight = 0.3;
    const responsivenessWeight = 0.2;

    // 响应速度得分（越快越好，60秒内响应得满分）
    const responsiveness = Math.min(100, (60 / avgResponseTime) * 100);

    const score =
      clickRate * clickWeight +
      (100 - ignoreRate) * ignoreWeight +
      responsiveness * responsivenessWeight;

    return Math.round(score * 100) / 100; // 保留2位小数
  }

  /**
   * 判断是否需要调整频率
   * 
   * @returns 'decrease' | 'increase' | 'no_change'
   */
  shouldAdjustFrequency(
    effectivenessScore: number,
    ignoreRate: number,
    sampleSize: number,
  ): 'decrease' | 'increase' | 'no_change' {
    // 样本不足，不做调整
    if (sampleSize < 10) {
      return 'no_change';
    }

    // 效果很差，大幅降低频率
    if (effectivenessScore < 20 && ignoreRate > 80) {
      return 'decrease';
    }

    // 效果较差，降低频率
    if (effectivenessScore < 40 && ignoreRate > 60) {
      return 'decrease';
    }

    // 效果很好，可以考虑增加频率
    if (effectivenessScore > 80 && ignoreRate < 20) {
      return 'increase';
    }

    // 效果正常，保持不变
    return 'no_change';
  }

  /**
   * 生成频率调整建议
   * 
   * @param templateId - 提醒模板ID
   * @returns 调整建议或null
   */
  async suggestFrequencyAdjustment(templateId: string): Promise<{
    originalInterval: number;
    adjustedInterval: number;
    reason: string;
  } | null> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template || !template.responseMetrics) {
      return null;
    }

    const metrics = template.responseMetrics;
    const recommendation = this.shouldAdjustFrequency(
      metrics.effectivenessScore,
      metrics.ignoreRate,
      metrics.sampleSize,
    );

    if (recommendation === 'no_change') {
      return null;
    }

    // 获取当前间隔（从 trigger 配置中提取）
    // 注意：这里需要根据实际的 trigger 配置结构来实现
    // 暂时使用示例值
    const currentInterval = 86400; // 1天，单位：秒

    let adjustedInterval: number;
    let reason: string;

    if (recommendation === 'decrease') {
      // 根据效果评分决定降低幅度
      if (metrics.effectivenessScore < 20) {
        adjustedInterval = currentInterval * 3; // 降低到1/3频率
        reason = `效果评分过低(${metrics.effectivenessScore})，忽略率高达${metrics.ignoreRate}%`;
      } else {
        adjustedInterval = currentInterval * 2; // 降低到1/2频率
        reason = `效果评分较低(${metrics.effectivenessScore})，忽略率${metrics.ignoreRate}%`;
      }
    } else {
      // increase
      adjustedInterval = Math.max(currentInterval * 0.75, 3600); // 增加25%，最小1小时
      reason = `效果评分优秀(${metrics.effectivenessScore})，可以适当增加频率`;
    }

    return {
      originalInterval: currentInterval,
      adjustedInterval: Math.round(adjustedInterval),
      reason,
    };
  }
}
