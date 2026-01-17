/**
 * @file FocusModeApplicationService.ts
 * @description 专注周期模式应用服务，负责专注周期的创建、查询、延期、失效和自动过期检查。
 * @date 2025-01-22
 */

import type { IFocusModeRepository, IGoalRepository } from '@dailyuse/domain-server/goal';
import { FocusMode } from '@dailyuse/domain-server/goal';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, HiddenGoalsMode, FocusModeClientDTO } from '@dailyuse/contracts/goal';


/**
 * 启用专注模式参数接口。
 */
export interface ActivateFocusModeParams {
  accountUuid: string;
  focusedGoalUuids: string[];
  startTime: number;
  endTime: number;
  hiddenGoalsMode: HiddenGoalsMode;
}

/**
 * 延期专注模式参数接口。
 */
export interface ExtendFocusModeParams {
  uuid: string;
  newEndTime: number;
}

/**
 * 专注周期应用服务。
 *
 * @remarks
 * 负责专注模式的核心业务逻辑，包括：
 * - 启用/关闭专注模式。
 * - 延期专注周期。
 * - 查询当前活跃周期。
 * - 自动失效过期周期（通过 Cron Job 调用）。
 * - 校验目标存在性和数量限制。
 *
 * @privateRemarks
 * 依赖注入 FocusModeRepository 和 GoalRepository。
 */
export class FocusModeApplicationService {
  public constructor(
    private readonly focusModeRepository: IFocusModeRepository,
    private readonly goalRepository: IGoalRepository,
  ) {}



  // ===== 专注模式管理 =====

  /**
   * 启用专注模式。
   *
   * @remarks
   * 业务规则：
   * 1. 同一账户同时只能有一个活跃的专注周期。
   * 2. 必须选择 1-3 个目标。
   * 3. 所有目标必须存在且属于该账户。
   * 4. endTime 必须大于 startTime。
   *
   * @param params - 启用参数
   * @returns {Promise<FocusModeClientDTO>} 创建的专注模式 DTO
   * @throws {Error} 当账户已有活跃周期、目标数量不符或目标无效时抛出
   */
  async activateFocusMode(params: ActivateFocusModeParams): Promise<FocusModeClientDTO> {
    const { accountUuid, focusedGoalUuids, startTime, endTime, hiddenGoalsMode } = params;

    // 1. 校验账户是否已有活跃周期
    const existingActive = await this.focusModeRepository.findActiveByAccountUuid(accountUuid);
    if (existingActive) {
      throw new Error(`Account ${accountUuid} already has an active focus mode`);
    }

    // 2. 校验目标数量
    if (focusedGoalUuids.length < 1 || focusedGoalUuids.length > 3) {
      throw new Error('Must select 1-3 goals for focus mode');
    }

    // 3. 校验所有目标存在且属于该账户
    await this.validateGoalsExist(accountUuid, focusedGoalUuids);

    // 4. 创建 FocusMode 值对象（会进行时间范围校验）
    const focusMode = FocusMode.create(
      crypto.randomUUID(),
      accountUuid,
      focusedGoalUuids,
      endTime,
      hiddenGoalsMode || 'hide',
    );

    // 5. 持久化
    await this.focusModeRepository.save(focusMode);

    // 6. 返回 ClientDTO
    return focusMode.toClientDTO();
  }

  /**
   * 关闭专注模式（手动失效）。
   *
   * @param uuid - 专注模式 UUID
   * @returns {Promise<FocusModeClientDTO>} 更新后的 DTO
   * @throws {Error} 当专注周期不存在或已失效时抛出
   */
  async deactivateFocusMode(uuid: string): Promise<FocusModeClientDTO> {
    // 1. 查找专注周期
    const focusMode = await this.focusModeRepository.findById(uuid);
    if (!focusMode) {
      throw new Error(`Focus mode not found: ${uuid}`);
    }

    // 2. 检查是否已失效
    if (!focusMode.isActive) {
      throw new Error(`Focus mode ${uuid} is already inactive`);
    }

    // 3. 失效（返回新实例）
    const deactivated = focusMode.deactivate();

    // 4. 持久化
    await this.focusModeRepository.save(deactivated);

    // 5. 返回 ClientDTO
    return deactivated.toClientDTO();
  }

  /**
   * 延期专注模式。
   *
   * @param params - 延期参数
   * @returns {Promise<FocusModeClientDTO>} 更新后的 DTO
   * @throws {Error} 当专注周期不存在、已失效或新时间无效时抛出
   */
  async extendFocusMode(params: ExtendFocusModeParams): Promise<FocusModeClientDTO> {
    const { uuid, newEndTime } = params;

    // 1. 查找专注周期
    const focusMode = await this.focusModeRepository.findById(uuid);
    if (!focusMode) {
      throw new Error(`Focus mode not found: ${uuid}`);
    }

    // 2. 检查是否已失效
    if (!focusMode.isActive) {
      throw new Error(`Focus mode ${uuid} is inactive, cannot extend`);
    }

    // 3. 延期（会校验 newEndTime > endTime）
    const extended = focusMode.extend(newEndTime);

    // 4. 持久化
    await this.focusModeRepository.save(extended);

    // 5. 返回 ClientDTO
    return extended.toClientDTO();
  }

  /**
   * 获取账户当前活跃的专注周期。
   *
   * @param accountUuid - 账户 UUID
   * @returns {Promise<FocusModeClientDTO | null>} 活跃周期或 null
   */
  async getActiveFocusMode(accountUuid: string): Promise<FocusModeClientDTO | null> {
    const focusMode = await this.focusModeRepository.findActiveByAccountUuid(accountUuid);
    return focusMode ? focusMode.toClientDTO() : null;
  }

  /**
   * 获取账户的所有专注周期（包括历史）。
   *
   * @param accountUuid - 账户 UUID
   * @returns {Promise<FocusModeClientDTO[]>} 周期列表（按创建时间倒序）
   */
  async getFocusModeHistory(accountUuid: string): Promise<FocusModeClientDTO[]> {
    const focusModes = await this.focusModeRepository.findByAccountUuid(accountUuid);
    return focusModes.map((fm) => fm.toClientDTO());
  }

  /**
   * 检查并失效过期的专注周期。
   *
   * @remarks
   * 通常由 Cron Job 定时调用（如每小时一次）。
   *
   * @returns {Promise<number>} 失效的周期数量
   */
  async checkAndDeactivateExpired(): Promise<number> {
    return await this.focusModeRepository.deactivateExpired();
  }

  // ===== 私有方法 =====

  /**
   * 校验所有目标存在且属于指定账户。
   *
   * @param accountUuid - 账户 UUID
   * @param goalUuids - 目标 UUID 列表
   * @throws {Error} 如果任何目标不存在或不属于该账户
   */
  private async validateGoalsExist(accountUuid: string, goalUuids: string[]): Promise<void> {
    for (const goalUuid of goalUuids) {
      const goal = await this.goalRepository.findById(goalUuid, { includeChildren: false });
      if (!goal) {
        throw new Error(`Goal not found: ${goalUuid}`);
      }
      if (goal.accountUuid !== accountUuid) {
        throw new Error(`Goal ${goalUuid} does not belong to account ${accountUuid}`);
      }
    }
  }
}
