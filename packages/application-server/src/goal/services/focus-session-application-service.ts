/**
 * @file FocusSessionApplicationService.ts
 * @description 专注会话应用服务，处理专注会话的生命周期管理
 * @date 2025-01-22
 */

import type { IFocusSessionRepository, IGoalRepository } from '@dailyuse/domain-server/goal';
import { FocusSessionDomainService, FocusSession, Goal } from '@dailyuse/domain-server/goal';

import { GoalStatus, FocusSessionStatus } from '@dailyuse/contracts/goal';
import { PriorityLevel } from '@dailyuse/contracts/shared';
import type {
  GoalServerDTO,
  GoalClientDTO,
  KeyResultServerDTO,
  CreateGoalRequest,
  UpdateGoalRequest,
  FocusSessionClientDTO,
} from '@dailyuse/contracts/goal';

/**
 * FocusSessionApplicationService
 *
 * 编排专注周期的业务用�?
 */
export class FocusSessionApplicationService {
  private domainService: FocusSessionDomainService;
  private sessionRepository: IFocusSessionRepository;
  private goalRepository: IGoalRepository;

  constructor(sessionRepository: IFocusSessionRepository, goalRepository: IGoalRepository) {
    this.domainService = new FocusSessionDomainService();
    this.sessionRepository = sessionRepository;
    this.goalRepository = goalRepository;
  }

  /**
   * 获取应用服务单例
   */

  // ===== 核心业务方法 =====

  /**
   * 创建并开始专注周期
   *
   * 业务流程：
   * 1. 查询已有会话（验证单个活跃会话规则）
   * 2. 查询关联目标（如果指定）
   * 3. 调用 DomainService 创建聚合根
   * 4. 立即开始（如果 startImmediately !== false）
   * 5. 持久化
   * 6. 返回 ClientDTO
   *
   * @param accountUuid - 账户 UUID
   * @param request - 创建请求
   * @returns FocusSession ClientDTO
   */
  async createAndStartSession(
    accountUuid: string,
    request: {
      goalUuid?: string | null;
      durationMinutes: number;
      description?: string | null;
      startImmediately?: boolean; // 默认 true
    },
  ): Promise<FocusSessionClientDTO> {
    // 1. 查询已有活跃会话（验证单个活跃会话规则）
    const existingSessions = await this.sessionRepository.findByAccountUuid(accountUuid, {
      status: [FocusSessionStatus.IN_PROGRESS, FocusSessionStatus.PAUSED],
    });

    this.domainService.validateSingleActiveSession(existingSessions, accountUuid);

    // 2. 查询关联目标（如果指定）
    let goal: Goal | null = null;
    if (request.goalUuid) {
      goal = await this.goalRepository.findById(request.goalUuid);
      this.domainService.validateAssociatedGoal(goal, accountUuid);
    }

    // 3. 调用 DomainService 创建聚合根（不持久化）
    const session = this.domainService.createFocusSession(
      {
        accountUuid,
        goalUuid: request.goalUuid,
        durationMinutes: request.durationMinutes,
        description: request.description,
      },
      goal,
    );

    // 4. 立即开始（如果指定）
    if (request.startImmediately !== false) {
      session.start();
    }

    // 5. 持久化
    await this.sessionRepository.save(session);

    // 6. 发布领域事件（未来实现）
    // await this.eventBus.publish(session.getDomainEvents());

    // 7. 返回 ClientDTO
    return session.toClientDTO();
  }

  /**
   * 暂停专注周期
   *
   * @param sessionUuid - 会话 UUID
   * @param accountUuid - 账户 UUID
   * @returns 更新后的 FocusSession ClientDTO
   */
  async pauseSession(sessionUuid: string, accountUuid: string): Promise<FocusSessionClientDTO> {
    return this.executeSessionAction(sessionUuid, accountUuid, (session) => {
      // DomainService 验证状态转换
      this.domainService.validateStateTransition(session.status, 'pause');
      // 聚合根执行业务逻辑
      session.pause();
    });
  }

  /**
   * 恢复专注周期
   *
   * @param sessionUuid - 会话 UUID
   * @param accountUuid - 账户 UUID
   * @returns 更新后的 FocusSession ClientDTO
   */
  async resumeSession(sessionUuid: string, accountUuid: string): Promise<FocusSessionClientDTO> {
    return this.executeSessionAction(sessionUuid, accountUuid, (session) => {
      this.domainService.validateStateTransition(session.status, 'resume');
      session.resume();
    });
  }

  /**
   * 完成专注周期
   *
   * @param sessionUuid - 会话 UUID
   * @param accountUuid - 账户 UUID
   * @returns 更新后的 FocusSession ClientDTO
   */
  async completeSession(sessionUuid: string, accountUuid: string): Promise<FocusSessionClientDTO> {
    return this.executeSessionAction(sessionUuid, accountUuid, (session) => {
      this.domainService.validateStateTransition(session.status, 'complete');
      session.complete();
    });
  }

  /**
   * 取消专注周期
   *
   * @param sessionUuid - 会话 UUID
   * @param accountUuid - 账户 UUID
   */
  async cancelSession(sessionUuid: string, accountUuid: string): Promise<void> {
    await this.executeSessionAction(sessionUuid, accountUuid, (session) => {
      this.domainService.validateStateTransition(session.status, 'cancel');
      session.cancel();
    });
  }

  /**
   * 获取活跃会话
   *
   * @param accountUuid - 账户 UUID
   * @returns 活跃会话 ClientDTO，不存在则返�?null
   */
  async getActiveSession(accountUuid: string): Promise<FocusSessionClientDTO | null> {
    const session = await this.sessionRepository.findActiveSession(accountUuid);
    return session ? session.toClientDTO() : null;
  }

  /**
   * 获取会话历史
   *
   * @param accountUuid - 账户 UUID
   * @param filters - 查询过滤条件
   * @returns 会话列表
   */
  async getSessionHistory(
    accountUuid: string,
    filters?: {
      goalUuid?: string;
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'startedAt' | 'completedAt';
      orderDirection?: 'asc' | 'desc';
    },
  ): Promise<FocusSessionClientDTO[]> {
    const sessions = await this.sessionRepository.findByAccountUuid(accountUuid, {
      goalUuid: filters?.goalUuid,
      status: filters?.status,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
      orderBy: filters?.orderBy || 'createdAt',
      orderDirection: filters?.orderDirection || 'desc',
    });

    return sessions.map((session) => session.toClientDTO());
  }

  /**
   * 获取会话详情
   *
   * @param sessionUuid - 会话 UUID
   * @param accountUuid - 账户 UUID
   * @returns 会话 ClientDTO
   */
  async getSession(sessionUuid: string, accountUuid: string): Promise<FocusSessionClientDTO> {
    const session = await this.sessionRepository.findById(sessionUuid);
    if (!session) {
      throw new Error('专注周期不存在');
    }

    // 验证所有权
    this.domainService.validateSessionOwnership(session, accountUuid);

    return session.toClientDTO();
  }

  /**
   * 删除会话
   *
   * 业务规则：只能删除已完成或已取消的会话
   *
   * @param sessionUuid - 会话 UUID
   * @param accountUuid - 账户 UUID
   */
  async deleteSession(sessionUuid: string, accountUuid: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionUuid);
    if (!session) {
      throw new Error('专注周期不存在');
    }

    // 验证所有权
    this.domainService.validateSessionOwnership(session, accountUuid);

    // 验证是否可以删除
    this.domainService.validateSessionDeletion(session);

    // 删除会话
    await this.sessionRepository.delete(sessionUuid);
  }

  /**
   * 获取会话统计信息
   *
   * @param accountUuid - 账户 UUID
   * @param options - 统计选项
   * @returns 统计信息
   */
  async getSessionStatistics(
    accountUuid: string,
    options?: {
      startDate?: number;
      endDate?: number;
      goalUuid?: string;
    },
  ): Promise<{
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    totalFocusMinutes: number;
    totalPauseMinutes: number;
    averageFocusMinutes: number;
    completionRate: number;
  }> {
    // 查询符合条件的所有会�?
    const sessions = await this.sessionRepository.findByAccountUuid(accountUuid, {
      goalUuid: options?.goalUuid,
      limit: 1000, // 获取所有会话用于统�?
    });

    // 过滤日期范围（如果指定）
    let filteredSessions = sessions;
    if (options?.startDate || options?.endDate) {
      filteredSessions = sessions.filter((session) => {
        const createdAt = session.createdAt;
        if (options.startDate && createdAt < options.startDate) return false;
        if (options.endDate && createdAt > options.endDate) return false;
        return true;
      });
    }

    // 调用 DomainService 计算统计信息
    return this.domainService.calculateSessionStatistics(filteredSessions);
  }

  // ===== 私有辅助方法 =====

  /**
   * 执行会话操作的通用模板方法（DRY 原则）
   *
   * 流程：
   * 1. 加载会话
   * 2. 验证所有权
   * 3. 执行操作（由调用方提供）
   * 4. 持久化
   * 5. 发布事件
   * 6. 返回 ClientDTO
   *
   * @param sessionUuid - 会话 UUID
   * @param accountUuid - 账户 UUID
   * @param action - 要执行的操作（回调函数）
   * @returns 更新后的 FocusSession ClientDTO
   */
  private async executeSessionAction(
    sessionUuid: string,
    accountUuid: string,
    action: (session: FocusSession) => void,
  ): Promise<FocusSessionClientDTO> {
    // 1. 加载会话
    const session = await this.sessionRepository.findById(sessionUuid);
    if (!session) {
      throw new Error('专注周期不存在');
    }

    // 2. 验证所有权
    this.domainService.validateSessionOwnership(session, accountUuid);

    // 3. 执行操作（可能抛出异常）
    action(session);

    // 4. 持久�?
    await this.sessionRepository.save(session);

    // 5. 发布领域事件（未来实现）
    // await this.eventBus.publish(session.getDomainEvents());

    // 6. 返回 ClientDTO
    return session.toClientDTO();
  }
}
