/**
 * Analyze Reminder Frequency Service
 *
 * 分析提醒频率效果
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IReminderTemplateRepository } from '../../../domain/repositories/i-reminder-template-repository';
import type { IReminderResponseRepository } from '../../../domain/repositories/i-reminder-response-repository';
import type { ReminderTemplate } from '../../../domain/aggregates/reminder-template';
import { ResponseMetrics } from '../../../domain/value-objects';

/**
 * 响应聚合统计
 *
 * 与 {@link IReminderResponseRepository.getResponseStats} 返回结构一致，
 * 由基础设施层按 lookbackDays 过滤并归类动作后给出。
 */
interface ResponseStats {
  total: number;
  clicked: number;
  ignored: number;
  snoozed: number;
  dismissed: number;
  completed: number;
  avgResponseTime: number;
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
export class AnalyzeReminderFrequencyUseCase {
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
  ): Promise<Result<ResponseMetrics | null>> {
    // 1. 获取提醒模板
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      return error('NOT_FOUND', `Template ${templateId} not found`);
    }

    const metrics = await this.analyzeTemplate(template, lookbackDays);
    return ok(metrics);
  }

  /**
   * 分析单个提醒模板的效果 (内部实现)
   *
   * 通过注入的响应仓储做聚合统计（`getResponseStats` 已在基础设施层按
   * `lookbackDays` 过滤并归类动作），再折算成 {@link ResponseMetrics}。
   * 样本量为 0 时返回 null，表示数据不足。
   */
  private async analyzeTemplate(
    template: ReminderTemplate,
    lookbackDays: number,
  ): Promise<ResponseMetrics | null> {
    const stats = await this.responseRepository.getResponseStats(template.id, lookbackDays);
    return this.calculateMetrics(stats, template);
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
  ): Promise<Result<GlobalAnalysisReport>> {
    const templates = await this.templateRepository.findByIdentityId(identityId);

    const reports: EffectivenessReport[] = [];
    let totalClickRate = 0;
    let totalEffectivenessScore = 0;

    for (const template of templates) {
      const metrics = await this.analyzeTemplate(template, lookbackDays);
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

    return ok({
      identityId,
      totalTemplates: templates.length,
      avgClickRate: templates.length > 0 ? totalClickRate / templates.length : 0,
      avgEffectivenessScore:
        templates.length > 0 ? totalEffectivenessScore / templates.length : 0,
      highEffective,
      lowEffective,
      analyzedAt: Date.now(),
    });
  }

  /**
   * 计算响应指标
   *
   * 输入为响应仓储的聚合统计，样本量为 0 时返回 null（数据不足）。
   */
  private calculateMetrics(
    stats: ResponseStats,
    _template: unknown,
  ): ResponseMetrics | null {
    const totalResponses = stats.total;
    if (totalResponses === 0) {
      return null;
    }

    const clickRate = stats.clicked / totalResponses;
    const ignoreRate = stats.ignored / totalResponses;
    const completedRate = stats.completed / totalResponses;

    // 计算效果评分 (0-1)：点击率主导，低忽略率与完成率为辅
    const effectivenessScore = clickRate * 0.6 + (1 - ignoreRate) * 0.2 + completedRate * 0.2;

    return ResponseMetrics.create({
      clickRate,
      ignoreRate,
      avgResponseTime: stats.avgResponseTime,
      snoozeCount: stats.snoozed,
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
