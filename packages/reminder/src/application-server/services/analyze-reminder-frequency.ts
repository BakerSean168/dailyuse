/**
 * Analyze Reminder Frequency Service
 *
 * 分析提醒频率效果
 */

import type { IReminderTemplateRepository } from '../../domain-server/repositories/IReminderTemplateRepository';
import type { IReminderResponseRepository } from '../../domain-server/repositories/IReminderResponseRepository';
import { ResponseMetrics } from '../../domain-server/value-objects';

/**
 * 响应行为类型
 */
type ResponseAction = 'clicked' | 'ignored' | 'snoozed' | 'dismissed' | 'completed';

/**
 * 响应记录接口
 */
interface ReminderResponseRecord {
  action: ResponseAction;
  responseTime: number | null;
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
  identityId: string;
  totalTemplates: number;
  avgClickRate: number;
  avgEffectivenessScore: number;
  highEffective: EffectivenessReport[];
  lowEffective: EffectivenessReport[];
  analyzedAt: number;
}

/**
 * Analyze Reminder Frequency Service
 *
 * 职责：
 * - 分析用户对提醒的响应模式
 * - 计算效果评分
 * - 生成频率调整建议
 */
export class AnalyzeReminderFrequency {
  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly responseRepository: IReminderResponseRepository,
  ) {}

  /**
   * 分析单个提醒模板的效果
   *
   * @param templateId - 提醒模板ID
   * @param lookbackDays - 回溯天数，默认30天
   * @returns 响应指标或null（数据不足时）
   */
  async execute(
    templateId: string,
    lookbackDays: number = 30,
  ): Promise<ResponseMetrics | null> {
    // 1. 获取提醒模板
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 2. 查询响应记录
    const lookbackMs = lookbackDays * 24 * 60 * 60 * 1000;
    const cutoffTime = BigInt(Date.now() - lookbackMs);

    // TODO: 需要运行 Prisma migration 后才能使用 reminderResponse
    // const records = await this.prisma.reminderResponse.findMany({
    //   where: {
    //     templateId: templateId,
    //     timestamp: { gte: cutoffTime },
    //   },
    // });

    // 3. 计算指标
    const metrics = this.calculateMetrics([], template);
    return metrics;
  }

  /**
   * 分析账户下的全局效果
   *
   * @param identityId - 账户 ID
   * @param lookbackDays - 回溯天数，默认30天
   * @returns 全局分析报告
   */
  async executeGlobal(
    identityId: string,
    lookbackDays: number = 30,
  ): Promise<GlobalAnalysisReport> {
    const templates = await this.templateRepository.findByAccountId(identityId);

    const reports: EffectivenessReport[] = [];
    let totalClickRate = 0;
    let totalEffectivenessScore = 0;

    for (const template of templates) {
      const metrics = await this.execute(template.id, lookbackDays);
      if (metrics) {
        const report = this.generateEffectivenessReport(template.id, metrics);
        reports.push(report);
        totalClickRate += report.clickRate;
        totalEffectivenessScore += report.effectivenessScore;
      }
    }

    const highEffective = reports
      .filter((r) => r.effectivenessScore > 0.7)
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, 5);

    const lowEffective = reports
      .filter((r) => r.effectivenessScore < 0.3)
      .sort((a, b) => a.effectivenessScore - b.effectivenessScore)
      .slice(0, 5);

    return {
      identityId,
      totalTemplates: templates.length,
      avgClickRate: templates.length > 0 ? totalClickRate / templates.length : 0,
      avgEffectivenessScore:
        templates.length > 0 ? totalEffectivenessScore / templates.length : 0,
      highEffective,
      lowEffective,
      analyzedAt: Date.now(),
    };
  }

  /**
   * 计算响应指标
   */
  private calculateMetrics(
    records: ReminderResponseRecord[],
    template: any,
  ): ResponseMetrics | null {
    if (records.length === 0) {
      return null;
    }

    const clicked = records.filter((r) => r.action === 'clicked').length;
    const ignored = records.filter((r) => r.action === 'ignored').length;
    const snoozed = records.filter((r) => r.action === 'snoozed').length;
    const dismissed = records.filter((r) => r.action === 'dismissed').length;
    const completed = records.filter((r) => r.action === 'completed').length;

    const totalResponses = records.length;
    const clickRate = clicked / totalResponses;
    const ignoreRate = ignored / totalResponses;
    const avgResponseTime =
      records
        .filter((r) => r.responseTime !== null)
        .reduce((sum, r) => sum + (r.responseTime || 0), 0) /
      records.filter((r) => r.responseTime !== null).length || 0;

    // 计算效果评分 (0-100)
    const effectivenessScore =
      (clickRate * 0.6 + (100 - ignoreRate) * 0.2 + (completed / totalResponses) * 0.2);

    return new ResponseMetrics({
      clickRate,
      ignoreRate,
      avgResponseTime,
      snoozeCount: snoozed,
      effectivenessScore,
      sampleSize: totalResponses,
      lastAnalysisTime: Date.now(),
    });
  }

  /**
   * 生成效果报告
   */
  private generateEffectivenessReport(
    templateId: string,
    metrics: ResponseMetrics,
  ): EffectivenessReport {
    let recommendation: 'decrease' | 'increase' | 'no_change' = 'no_change';
    if (metrics.effectivenessScore > 0.7) {
      recommendation = 'decrease'; // 高效，可以减少频率
    } else if (metrics.effectivenessScore < 0.3) {
      recommendation = 'increase'; // 低效，需要增加频率
    }

    return {
      templateId: templateId,
      clickRate: metrics.clickRate,
      ignoreRate: metrics.ignoreRate,
      avgResponseTime: metrics.avgResponseTime,
      effectivenessScore: metrics.effectivenessScore,
      sampleSize: metrics.sampleSize,
      recommendation,
    };
  }
}
