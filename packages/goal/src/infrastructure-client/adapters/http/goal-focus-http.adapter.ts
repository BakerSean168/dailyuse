/**
 * Goal Focus HTTP Adapter
 *
 * HTTP implementation of IGoalFocusApiClient using ResultHttpClient.
 * Provides focus session management for web clients.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IGoalFocusApiClient, IResultHttpClient } from '../types';
import type { FocusModeClientDTO, ActivateFocusModeRequest } from '@dailyuse/contracts/goal';

export class GoalFocusHttpAdapter implements IGoalFocusApiClient {
  private readonly baseUrl = '/goals/focus-mode';

  constructor(private readonly httpClient: IResultHttpClient) {}

  // ===== Session Management =====

  async getCurrentFocusMode(): Promise<Result<FocusModeClientDTO | null>> {
    return this.httpClient.get(this.baseUrl);
  }

  async activateFocusMode(request: ActivateFocusModeRequest): Promise<Result<FocusModeClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/activate`, request);
  }

  async deactivateFocusMode(): Promise<Result<FocusModeClientDTO | null>> {
    return this.httpClient.post(`${this.baseUrl}/deactivate`);
  }

  async extendFocusMode(request: { newEndTime: number }): Promise<Result<FocusModeClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/extend`, request);
  }
}
