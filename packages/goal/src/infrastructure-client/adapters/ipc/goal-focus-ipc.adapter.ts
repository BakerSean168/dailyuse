/**
 * Goal Focus IPC Adapter
 *
 * IPC implementation of IGoalFocusApiClient using ResultIpcClient.
 * Focus functionality is only available in Electron desktop.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IGoalFocusApiClient, IResultIpcClient } from '../types';
import type { FocusModeDTO, ActivateFocusModeRequest } from '@dailyuse/contracts/goal';
import { createLogger } from '@dailyuse/utils';

export class GoalFocusIpcAdapter implements IGoalFocusApiClient {
  private readonly channel = 'goal:focus-mode';
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
    const channel = `${this.channel}:get`;
    this.logger.info('获取当前专注模式开始', { channel });
    const result = await this.ipcClient.invoke<FocusModeDTO | null>(channel);
    this.logger.info(`获取当前专注模式结果 ${this.stringify({ ok: result.ok })}`);
    return result;
  }

  async activateFocusMode(request: ActivateFocusModeRequest): Promise<Result<FocusModeDTO>> {
    const channel = `${this.channel}:activate`;
    this.logger.info(`启用专注模式开始 ${this.stringify({ channel, request })}`);
    const result = await this.ipcClient.invoke<FocusModeDTO>(channel, request);
    this.logger.info(`启用专注模式结果 ${this.stringify({ ok: result.ok })}`);
    return result;
  }

  async deactivateFocusMode(): Promise<Result<FocusModeDTO | null>> {
    const channel = `${this.channel}:deactivate`;
    this.logger.info('停用专注模式开始', { channel });
    const result = await this.ipcClient.invoke<FocusModeDTO | null>(channel);
    this.logger.info(`停用专注模式结果 ${this.stringify({ ok: result.ok })}`);
    return result;
  }

  async extendFocusMode(request: { newEndTime: number }): Promise<Result<FocusModeDTO>> {
    const channel = `${this.channel}:extend`;
    this.logger.info(`延长专注模式开始 ${this.stringify({ channel, request })}`);
    const result = await this.ipcClient.invoke<FocusModeDTO>(channel, request);
    this.logger.info(`延长专注模式结果 ${this.stringify({ ok: result.ok })}`);
    return result;
  }
}
