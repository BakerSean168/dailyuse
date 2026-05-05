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
  HiddenGoalsMode,
} from '@dailyuse/contracts/goal';
import { FocusModeId, GoalId } from '@/domain-shared';
import type { IdentityId } from '@dailyuse/contracts/primitives';

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
    identityId: string,
    focusedGoalIds: string[],
    startTime: number,
    endTime: number,
    hiddenGoalsMode: HiddenGoalsMode = 'Hide',
  ): FocusMode {
    if (endTime <= startTime) {
      throw new Error('Focus mode end time must be later than start time');
    }

    return new FocusMode({
      id: FocusModeId.of(id),
      identityId: identityId as IdentityId,
      focusedGoalIds: focusedGoalIds as GoalId[],
      startTime,
      endTime,
      hiddenGoalsMode,
      isActive: true,
      actualEndTime: null,
      createdAt: startTime,
      updatedAt: startTime,
    });
  }

  /**
   * 从 DTO 恢复
   */
  public static fromDTO(dto: FocusModeDTO): FocusMode {
    return new FocusMode(dto);
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
    if (!this.props.isActive) {
      throw new Error('Cannot extend an inactive focus mode');
    }
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

}
