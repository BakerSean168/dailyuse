/**
 * ResponseMetrics 值对象
 * 
 * 响应指标：点击率、忽略率、效果评分等
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@memoflow/utils/domain';
import type {
  ResponseMetrics as IResponseMetrics,
  ResponseMetricsDTO,
} from '@memoflow/contracts/reminder';

/**
 * ResponseMetrics 值对象实现
 */
export class ResponseMetrics extends ValueObject<ResponseMetricsDTO> implements IResponseMetrics {

  private constructor(props: ResponseMetricsDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: ResponseMetricsDTO): ResponseMetrics {
    return new ResponseMetrics(props);
  }

  public static createEmpty(): ResponseMetrics {
    return new ResponseMetrics({
      clickRate: 0,
      ignoreRate: 0,
      avgResponseTime: 0,
      snoozeCount: 0,
      effectivenessScore: 0,
      sampleSize: 0,
      lastAnalysisTime: Date.now(),
    });
  }

  public static fromDTO(dto: ResponseMetricsDTO): ResponseMetrics {
    return new ResponseMetrics(dto);
  }

  // ================= Getters =================

  public get clickRate(): number {
    return this.props.clickRate;
  }

  public get ignoreRate(): number {
    return this.props.ignoreRate;
  }

  public get avgResponseTime(): number {
    return this.props.avgResponseTime;
  }

  public get snoozeCount(): number {
    return this.props.snoozeCount;
  }

  public get effectivenessScore(): number {
    return this.props.effectivenessScore;
  }

  public get sampleSize(): number {
    return this.props.sampleSize;
  }

  public get lastAnalysisTime(): number {
    return this.props.lastAnalysisTime;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<ResponseMetricsDTO>,
  ): ResponseMetrics {
    return new ResponseMetrics({ ...this.props, ...updates });
  }

  public updateMetrics(params: Partial<ResponseMetricsDTO>): ResponseMetrics {
    return this.with({
      ...params,
      lastAnalysisTime: Date.now(),
    });
  }

  // ================= 计算属性 =================

  public get hasSamples(): boolean {
    return this.props.sampleSize > 0;
  }

  public get effectivenessLabel(): 'high' | 'medium' | 'low' {
    if (this.props.effectivenessScore >= 70) return 'high';
    if (this.props.effectivenessScore >= 40) return 'medium';
    return 'low';
  }

  public get effectivenessColor(): string {
    const colors = { high: 'success', medium: 'warning', low: 'error' };
    return colors[this.effectivenessLabel];
  }

  // ================= 序列化 =================

  public toDTO(): ResponseMetricsDTO {
    return { ...this.props };
  }
}
