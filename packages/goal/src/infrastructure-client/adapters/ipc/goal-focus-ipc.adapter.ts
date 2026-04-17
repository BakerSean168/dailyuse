/**
 * Goal Focus IPC Adapter
 *
 * IPC implementation of IGoalFocusApiClient using ResultIpcClient.
 * Focus functionality is only available in Electron desktop.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IGoalFocusApiClient, IResultIpcClient } from '../types';
import type { FocusModeClientDTO, ActivateFocusModeRequest } from '@dailyuse/contracts/goal';

export class GoalFocusIpcAdapter implements IGoalFocusApiClient {
  private readonly channel = 'goal:focus-mode';

  constructor(private readonly ipcClient: IResultIpcClient) {}

  // ===== Session Management =====

  async getCurrentFocusMode(): Promise<Result<FocusModeClientDTO | null>> {
    return this.ipcClient.invoke(`${this.channel}:get`);
  }

  async activateFocusMode(request: ActivateFocusModeRequest): Promise<Result<FocusModeClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:activate`, request);
  }

  async deactivateFocusMode(): Promise<Result<FocusModeClientDTO | null>> {
    return this.ipcClient.invoke(`${this.channel}:deactivate`);
  }

  async extendFocusMode(request: { newEndTime: number }): Promise<Result<FocusModeClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:extend`, request);
  }
}
