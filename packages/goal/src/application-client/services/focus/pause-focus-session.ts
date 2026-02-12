/**
 * Pause Focus Session
 *
 * 暂停专注会话用例
 */

import type { IGoalFocusApiClient } from '@/infrastructure-client';
import type { FocusSessionClientDTO } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Pause Focus Session Use Case
 */
export class PauseFocusSession {
  private static instance: PauseFocusSession;

  private constructor(private readonly apiClient: IGoalFocusApiClient) {}

  static createInstance(apiClient?: IGoalFocusApiClient): PauseFocusSession {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getFocusApiClient();
    PauseFocusSession.instance = new PauseFocusSession(client);
    return PauseFocusSession.instance;
  }

  static getInstance(): PauseFocusSession {
    if (!PauseFocusSession.instance) {
      PauseFocusSession.instance = PauseFocusSession.createInstance();
    }
    return PauseFocusSession.instance;
  }

  static resetInstance(): void {
    PauseFocusSession.instance = undefined as unknown as PauseFocusSession;
  }

  async execute(): Promise<FocusSessionClientDTO> {
    return this.apiClient.pauseSession();
  }
}
