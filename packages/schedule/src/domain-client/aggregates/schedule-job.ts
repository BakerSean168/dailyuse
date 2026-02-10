/**
 * ScheduleJob Aggregate Root - Domain Client
 * 调度作业聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 ScheduleJobClient 接口
 * - Private constructor with props object
 * - Public getters via this._props.xxx
 * - Static fromDTO(dto: ScheduleJobClientDTO): ScheduleJob
 * - Instance toDTO(): ScheduleJobClientDTO
 */

import type {
  ScheduleJobClient,
  ScheduleJobClientDTO,
} from '@dailyuse/contracts/schedule';
import { AggregateRoot } from '@dailyuse/utils';
import { ScheduleId } from '@/domain-shared';
import { IdentityId } from '@dailyuse/domain-shared';

// 内部状态接口
interface ScheduleJobState {
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
}

export class ScheduleJob extends AggregateRoot<ScheduleId> implements ScheduleJobClient {
  private readonly _props: ScheduleJobState;

  private constructor(props: ScheduleJobState) {
    super(props.id);
    this._props = props;
  }

  // ================= Getters =================
  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get nextRunAt(): Date {
    return this._props.nextRunAt;
  }

  get cronExpression(): string | null {
    return this._props.cronExpression;
  }

  get sourceModule(): string {
    return this._props.sourceModule;
  }

  get sourceId(): string {
    return this._props.sourceId;
  }

  get triggerEvent(): string {
    return this._props.triggerEvent;
  }

  get payload(): Record<string, any> | null {
    return this._props.payload ? { ...this._props.payload } : null;
  }

  // UI 辅助属性
  get nextRunAtFormatted(): string {
    return this._props.nextRunAtFormatted;
  }

  get cronExpressionDisplay(): string {
    return this._props.cronExpressionDisplay;
  }

  get sourceDisplay(): string {
    return this._props.sourceDisplay;
  }

  get payloadDisplay(): string {
    return this._props.payloadDisplay;
  }

  // ================= Factory Methods =================
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

  // ================= DTO Conversion =================
  public toDTO(): ScheduleJobClientDTO {
    return {
      id: String(this._props.id),
      identityId: String(this._props.identityId),
      nextRunAt: this._props.nextRunAt.getTime(),
      cronExpression: this._props.cronExpression,
      sourceModule: this._props.sourceModule,
      sourceId: this._props.sourceId,
      triggerEvent: this._props.triggerEvent,
      payload: this._props.payload ? { ...this._props.payload } : null,
    };
  }
}
