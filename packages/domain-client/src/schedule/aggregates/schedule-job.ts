/**
 * ScheduleJob Aggregate Root - Domain Client
 * 调度作业聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 ScheduleJobClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: ScheduleJobClientDTO): ScheduleJob
 * - Instance toDTO(): ScheduleJobClientDTO
 */

import type {
  ScheduleJobClient,
  ScheduleJobClientDTO,
} from '@dailyuse/contracts/schedule';
import { AggregateRoot } from '@dailyuse/utils';
import { ScheduleId } from '@dailyuse/domain-shared/schedule';
import { IdentityId } from '@dailyuse/domain-shared';

export class ScheduleJob extends AggregateRoot<ScheduleId> implements ScheduleJobClient {
  // ================= 1. Backing Fields =================
  private _identityId: IdentityId;
  private _nextRunAt: Date;
  private _cronExpression: string | null;
  private _sourceModule: string;
  private _sourceId: string;
  private _triggerEvent: string;
  private _payload: Record<string, any> | null;

  // UI 辅助属性
  private _nextRunAtFormatted: string;
  private _cronExpressionDisplay: string;
  private _sourceDisplay: string;
  private _payloadDisplay: string;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: ScheduleId;
    identityId: IdentityId;
    nextRunAt: Date;
    cronExpression: string | null;
    sourceModule: string;
    sourceId: string;
    triggerEvent: string;
    payload: Record<string, any> | null;
    nextRunAtFormatted: string;
    cronExpressionDisplay: string;
    sourceDisplay: string;
    payloadDisplay: string;
  }) {
    super(params.id);
    this._identityId = params.identityId;
    this._nextRunAt = params.nextRunAt;
    this._cronExpression = params.cronExpression;
    this._sourceModule = params.sourceModule;
    this._sourceId = params.sourceId;
    this._triggerEvent = params.triggerEvent;
    this._payload = params.payload;
    this._nextRunAtFormatted = params.nextRunAtFormatted;
    this._cronExpressionDisplay = params.cronExpressionDisplay;
    this._sourceDisplay = params.sourceDisplay;
    this._payloadDisplay = params.payloadDisplay;
  }

  // ================= 3. Getters =================
  get identityId(): IdentityId {
    return this._identityId;
  }

  get nextRunAt(): Date {
    return this._nextRunAt;
  }

  get cronExpression(): string | null {
    return this._cronExpression;
  }

  get sourceModule(): string {
    return this._sourceModule;
  }

  get sourceId(): string {
    return this._sourceId;
  }

  get triggerEvent(): string {
    return this._triggerEvent;
  }

  get payload(): Record<string, any> | null {
    return this._payload ? { ...this._payload } : null;
  }

  // UI 辅助属性
  get nextRunAtFormatted(): string {
    return this._nextRunAtFormatted;
  }

  get cronExpressionDisplay(): string {
    return this._cronExpressionDisplay;
  }

  get sourceDisplay(): string {
    return this._sourceDisplay;
  }

  get payloadDisplay(): string {
    return this._payloadDisplay;
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: ScheduleJobClientDTO): ScheduleJob {
    return new ScheduleJob({
      id: ScheduleId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      nextRunAt: new Date(dto.nextRunAt),
      cronExpression: dto.cronExpression,
      sourceModule: dto.sourceModule,
      sourceId: dto.sourceId,
      triggerEvent: dto.triggerEvent,
      payload: dto.payload,
      // UI 辅助属性计算
      nextRunAtFormatted: new Date(dto.nextRunAt).toLocaleString(),
      cronExpressionDisplay: dto.cronExpression ?? '一次性任务',
      sourceDisplay: `${dto.sourceModule}:${dto.sourceId}`,
      payloadDisplay: dto.payload ? JSON.stringify(dto.payload) : '',
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): ScheduleJobClientDTO {
    return {
      id: String(this.id),
      identityId: String(this._identityId),
      nextRunAt: this._nextRunAt.getTime(),
      cronExpression: this._cronExpression,
      sourceModule: this._sourceModule,
      sourceId: this._sourceId,
      triggerEvent: this._triggerEvent,
      payload: this._payload ? { ...this._payload } : null,
    };
  }
}
