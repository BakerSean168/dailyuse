/**
 * Goal Focus IPC Adapter
 *
 * IPC implementation of IGoalFocusApiClient using ResultIpcClient.
 * Focus functionality is only available in Electron desktop.
 */

import type { Result } from '@memoflow/contracts/result';
import { GoalChannels } from '@memoflow/contracts/electron';
import type { IGoalFocusApiClient, IResultIpcClient } from '../types';
import type { FocusModeDTO, ActivateFocusModeRequest } from '@memoflow/contracts/goal';
import { createLogger } from '@memoflow/utils/logger';

export class GoalFocusIpcAdapter implements IGoalFocusApiClient {
  private readonly logger = createLogger('goal:focus-ipc');

  constructor(private readonly ipcClient: IResultIpcClient) {}

  private stringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  // ===== Session Management =====

  async getCurrentFocusMode(): Promise<Result<FocusModeDTO | null>> {
    const channel = GoalChannels.FOCUS_MODE_GET;
    this.logger.info('获取当前专注模式开始', { channel });
    const result = await this.ipcClient.invoke<FocusModeDTO | null>(channel);
    this.logger.info(`获取当前专注模式结果 ${this.stringify({ ok: result.ok })}`);
    return result;
  }

  async activateFocusMode(request: ActivateFocusModeRequest): Promise<Result<FocusModeDTO>> {
    const channel = GoalChannels.FOCUS_MODE_ACTIVATE;
    this.logger.info(`启用专注模式开始 ${this.stringify({ channel, request })}`);
    const result = await this.ipcClient.invoke<FocusModeDTO>(channel, request);
    this.logger.info(`启用专注模式结果 ${this.stringify({ ok: result.ok })}`);
    return result;
  }

  async deactivateFocusMode(): Promise<Result<FocusModeDTO | null>> {
    const channel = GoalChannels.FOCUS_MODE_DEACTIVATE;
    this.logger.info('停用专注模式开始', { channel });
    const result = await this.ipcClient.invoke<FocusModeDTO | null>(channel);
    this.logger.info(`停用专注模式结果 ${this.stringify({ ok: result.ok })}`);
    return result;
  }

  async extendFocusMode(request: { newEndTime: number }): Promise<Result<FocusModeDTO>> {
    const channel = GoalChannels.FOCUS_MODE_EXTEND;
    this.logger.info(`延长专注模式开始 ${this.stringify({ channel, request })}`);
    const result = await this.ipcClient.invoke<FocusModeDTO>(channel, request);
    this.logger.info(`延长专注模式结果 ${this.stringify({ ok: result.ok })}`);
    return result;
  }
}
