/**
 * Goal Focus IPC Adapter
 *
 * IPC implementation of IGoalFocusApiClient for Electron desktop.
 * Communicates with main process for focus session operations.
 */

import type { IGoalFocusApiClient } from '../../ports/goal-focus-api-client.port';
import type { IpcClient } from '../../../shared/ipc-client.types';
import type {
  FocusSessionClientDTO,
  FocusStatusDTO,
  FocusHistoryDTO,
  FocusStatisticsDTO,
  StartFocusRequest,
  GetFocusHistoryRequest,
} from '@dailyuse/contracts/goal';

/**
 * Goal Focus IPC Adapter
 *
 * Uses Electron IPC to communicate with main process for focus operations.
 */
export class GoalFocusIpcAdapter implements IGoalFocusApiClient {
  private readonly channel = 'goal:focus';

  constructor(private readonly ipcClient: IpcClient) {}

  // ===== Session Management =====

  async startSession(request: StartFocusRequest): Promise<FocusSessionClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:start`, request);
  }

  async pauseSession(): Promise<FocusSessionClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:pause`);
  }

  async resumeSession(): Promise<FocusSessionClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:resume`);
  }

  async stopSession(notes?: string): Promise<FocusSessionClientDTO | null> {
    return this.ipcClient.invoke(`${this.channel}:stop`, { notes });
  }

  // ===== Status & History =====

  async getStatus(): Promise<FocusStatusDTO> {
    return this.ipcClient.invoke(`${this.channel}:status`);
  }

  async getHistory(request: GetFocusHistoryRequest): Promise<FocusHistoryDTO> {
    return this.ipcClient.invoke(`${this.channel}:history`, request);
  }

  async getStatistics(goalUuid?: string): Promise<FocusStatisticsDTO> {
    return this.ipcClient.invoke(`${this.channel}:statistics`, { goalUuid });
  }

  // ===== Convenience Methods =====

  async isActive(): Promise<boolean> {
    const status = await this.getStatus();
    return status.isActive;
  }

  async getTodayHistory(goalUuid?: string): Promise<FocusHistoryDTO> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    return this.getHistory({
      goalUuid,
      startDate: startOfDay,
      endDate: endOfDay,
    });
  }

  async getWeekHistory(goalUuid?: string): Promise<FocusHistoryDTO> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - dayOfWeek
    ).getTime();
    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000 - 1;

    return this.getHistory({
      goalUuid,
      startDate: startOfWeek,
      endDate: endOfWeek,
    });
  }
}

/**
 * Create GoalFocusIpcAdapter instance
 */
export function createGoalFocusIpcAdapter(ipcClient: IpcClient): GoalFocusIpcAdapter {
  return new GoalFocusIpcAdapter(ipcClient);
}
