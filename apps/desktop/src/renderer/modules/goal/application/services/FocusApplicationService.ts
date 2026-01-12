/**
 * Focus Application Service
 *
 * 专注功能的 Application Service (thin wrapper)
 * 封装 @dailyuse/application-client 的 Focus Use Cases
 *
 * @module goal/application/services
 */

import {
  StartFocusSession,
  PauseFocusSession,
  ResumeFocusSession,
  StopFocusSession,
  GetFocusStatus,
  GetFocusHistory,
  GetFocusStatistics,
} from '@dailyuse/application-client';
import type {
  FocusSessionClientDTO,
  FocusStatusDTO,
  FocusHistoryDTO,
  FocusStatisticsDTO,
  StartFocusRequest,
  GetFocusHistoryRequest,
} from '@dailyuse/contracts/goal';

/**
 * Focus Application Service
 *
 * 提供专注功能的应用层服务
 */
export class FocusApplicationService {
  /**
   * 开始专注会话
   */
  async startSession(request: StartFocusRequest): Promise<FocusSessionClientDTO> {
    return StartFocusSession.getInstance().execute(request);
  }

  /**
   * 暂停当前会话
   */
  async pauseSession(): Promise<FocusSessionClientDTO> {
    return PauseFocusSession.getInstance().execute();
  }

  /**
   * 恢复暂停的会话
   */
  async resumeSession(): Promise<FocusSessionClientDTO> {
    return ResumeFocusSession.getInstance().execute();
  }

  /**
   * 停止当前会话
   */
  async stopSession(notes?: string): Promise<FocusSessionClientDTO | null> {
    return StopFocusSession.getInstance().execute(notes);
  }

  /**
   * 获取当前专注状态
   */
  async getStatus(): Promise<FocusStatusDTO> {
    return GetFocusStatus.getInstance().execute();
  }

  /**
   * 获取专注历史
   */
  async getHistory(request?: GetFocusHistoryRequest): Promise<FocusHistoryDTO> {
    return GetFocusHistory.getInstance().execute(request);
  }

  /**
   * 获取今日专注历史
   */
  async getTodayHistory(goalUuid?: string): Promise<FocusHistoryDTO> {
    return GetFocusHistory.getInstance().getTodayHistory(goalUuid);
  }

  /**
   * 获取本周专注历史
   */
  async getWeekHistory(goalUuid?: string): Promise<FocusHistoryDTO> {
    return GetFocusHistory.getInstance().getWeekHistory(goalUuid);
  }

  /**
   * 获取专注统计
   */
  async getStatistics(goalUuid?: string): Promise<FocusStatisticsDTO> {
    return GetFocusStatistics.getInstance().execute(goalUuid);
  }
}

/**
 * Focus Application Service 单例
 */
export const focusApplicationService = new FocusApplicationService();
