/**
 * Goal Focus IPC Adapter
 *
 * IPC implementation of IGoalFocusApiClient using ResultIpcClient.
 * Focus functionality is only available in Electron desktop.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { IGoalFocusApiClient, IResultIpcClient } from '../types';
import type {
  FocusSessionClientDTO,
  StartFocusReq,
  GetFocusHistoryReq,
  GetFocusStatusRes,
  GetFocusHistoryRes,
  GetFocusStatisticsRes,
} from '@dailyuse/contracts/goal';

export class GoalFocusIpcAdapter implements IGoalFocusApiClient {
  private readonly channel = 'goal:focus';

  constructor(private readonly ipcClient: IResultIpcClient) {}

  // ===== Session Management =====

  async startSession(
    request: StartFocusReq,
  ): Promise<Result<FocusSessionClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:start`, request);
  }

  async pauseSession(): Promise<Result<FocusSessionClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:pause`);
  }

  async resumeSession(): Promise<Result<FocusSessionClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:resume`);
  }

  async stopSession(
    notes?: string,
  ): Promise<Result<FocusSessionClientDTO | null>> {
    return this.ipcClient.invoke(`${this.channel}:stop`, { notes });
  }

  // ===== Status & History =====

  async getStatus(): Promise<Result<GetFocusStatusRes>> {
    return this.ipcClient.invoke(`${this.channel}:status`);
  }

  async getHistory(
    request: GetFocusHistoryReq,
  ): Promise<Result<GetFocusHistoryRes>> {
    return this.ipcClient.invoke(`${this.channel}:history`, request);
  }

  async getStatistics(
    goalId?: string,
  ): Promise<Result<GetFocusStatisticsRes>> {
    return this.ipcClient.invoke(`${this.channel}:statistics`, { goalId });
  }

  // ===== Convenience Methods =====

  async isActive(): Promise<Result<boolean>> {
    const result = await this.getStatus();
    if (!result.ok) return result;
    return ok(result.data.isActive);
  }

  async getTodayHistory(
    goalId?: string,
  ): Promise<Result<GetFocusHistoryRes>> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    return this.getHistory({
      goalId,
      startDate: startOfDay,
      endDate: endOfDay,
      limit: 100,
      offset: 0,
    });
  }

  async getWeekHistory(
    goalId?: string,
  ): Promise<Result<GetFocusHistoryRes>> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - dayOfWeek,
    ).getTime();
    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000 - 1;

    return this.getHistory({
      goalId,
      startDate: startOfWeek,
      endDate: endOfWeek,
      limit: 100,
      offset: 0,
    });
  }
}
