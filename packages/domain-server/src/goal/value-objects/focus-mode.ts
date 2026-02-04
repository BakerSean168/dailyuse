/**
 * FocusMode 值对象
 * 专注模式值对象
 *
 * 用于管理专注周期的创建和查询
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  FocusMode as IFocusMode,
  FocusModeDTO,
  FocusModeClientDTO,
  FocusModePersistenceDTO,
  HiddenGoalsMode,
} from '@dailyuse/contracts/goal';
import type { FocusModeId, IdentityId, GoalId } from '@dailyuse/contracts/primitives';

/**
 * FocusMode 值对象实现
 */
export class FocusMode extends ValueObject<FocusModeDTO> implements IFocusMode {
  private constructor(props: FocusModeDTO) {
    super(props);
  }

  // ================= Getters =================

  get id(): FocusModeId {
    return this.props.id;
  }

  get identityId(): IdentityId {
    return this.props.identityId;
  }

  get focusedGoalIds(): GoalId[] {
    return [...this.props.focusedGoalIds];
  }

  get startTime(): Date {
    return new Date(this.props.startTime);
  }

  get endTime(): Date {
    return new Date(this.props.endTime);
  }

  get hiddenGoalsMode(): HiddenGoalsMode {
    return this.props.hiddenGoalsMode;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get actualEndTime(): Date | null {
    return this.props.actualEndTime ? new Date(this.props.actualEndTime) : null;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  // ================= Factory Methods =================

  /**
   * 创建新的 FocusMode
   */
  public static create(
    id: string,
    accountUuid: string,
    focusedGoalUuids: string[],
    endTime: number,
    hiddenGoalsMode: HiddenGoalsMode = 'hide',
  ): FocusMode {
    const now = Date.now();
    return new FocusMode({
      id: id as FocusModeId,
      identityId: accountUuid as IdentityId,
      focusedGoalIds: focusedGoalUuids as GoalId[],
      startTime: now,
      endTime,
      hiddenGoalsMode,
      isActive: true,
      actualEndTime: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 DTO 恢复
   */
  public static fromDTO(dto: FocusModeDTO): FocusMode {
    return new FocusMode(dto);
  }

  /**
   * 从 Persistence DTO 恢复
   */
  public static fromPersistenceDTO(dto: FocusModePersistenceDTO): FocusMode {
    return new FocusMode({
      id: dto.id,
      identityId: dto.identityId,
      focusedGoalIds: [], // 需要从关联表加载
      startTime: new Date(dto.startTime).getTime(),
      endTime: new Date(dto.endTime).getTime(),
      hiddenGoalsMode: dto.hiddenGoalsMode as HiddenGoalsMode,
      isActive: dto.isActive,
      actualEndTime: dto.actualEndTime ? new Date(dto.actualEndTime).getTime() : null,
      createdAt: new Date(dto.createdAt).getTime(),
      updatedAt: new Date(dto.updatedAt).getTime(),
    });
  }

  // ================= Business Methods =================

  /**
   * 失效（手动结束）
   */
  public deactivate(): FocusMode {
    const now = Date.now();
    return new FocusMode({
      ...this.props,
      isActive: false,
      actualEndTime: now,
      updatedAt: now,
    });
  }

  /**
   * 延长时间
   */
  public extend(newEndTime: number): FocusMode {
    if (newEndTime <= this.props.endTime) {
      throw new Error('New end time must be later than current end time');
    }
    return new FocusMode({
      ...this.props,
      endTime: newEndTime,
      updatedAt: Date.now(),
    });
  }

  /**
   * 计算剩余天数
   */
  public getRemainingDays(): number {
    const now = Date.now();
    const remaining = this.props.endTime - now;
    return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
  }

  // ================= Serialization =================

  /**
   * 转换为 DTO
   */
  public toDTO(): FocusModeDTO {
    return { ...this.props };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): FocusModeClientDTO {
    return {
      id: this.props.id,
      identityId: this.props.identityId,
      focusedGoalIds: [...this.props.focusedGoalIds],
      startTime: this.props.startTime,
      endTime: this.props.endTime,
      hiddenGoalsMode: this.props.hiddenGoalsMode,
      isActive: this.props.isActive,
      actualEndTime: this.props.actualEndTime,
      remainingDays: this.getRemainingDays(),
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): FocusModePersistenceDTO {
    return {
      id: this.props.id,
      identityId: this.props.identityId,
      name: '', // 需要名称字段吗？
      startTime: new Date(this.props.startTime),
      endTime: new Date(this.props.endTime),
      hiddenGoalsMode: this.props.hiddenGoalsMode,
      isActive: this.props.isActive,
      actualEndTime: this.props.actualEndTime ? new Date(this.props.actualEndTime) : null,
      createdAt: new Date(this.props.createdAt),
      updatedAt: new Date(this.props.updatedAt),
    };
  }
}
