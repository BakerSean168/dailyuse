/**
 * Stop Focus Session
 *
 * 停止专注会话用例
 */

import type { IGoalFocusApiClient } from '@/infrastructure-client';
import type { FocusSessionClientDTO } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Stop Focus Session Use Case
 */
export class StopFocusSession {
  private static instance: StopFocusSession;

  private constructor(private readonly apiClient: IGoalFocusApiClient) {}

  static createInstance(apiClient?: IGoalFocusApiClient): StopFocusSession {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getFocusApiClient();
    StopFocusSession.instance = new StopFocusSession(client);
    return StopFocusSession.instance;
  }

  static getInstance(): StopFocusSession {
    if (!StopFocusSession.instance) {
      StopFocusSession.instance = StopFocusSession.createInstance();
    }
    return StopFocusSession.instance;
  }

  static resetInstance(): void {
    StopFocusSession.instance = undefined as unknown as StopFocusSession;
  }

  async execute(notes?: string): Promise<FocusSessionClientDTO | null> {
    return this.apiClient.stopSession(notes);
  }
}
