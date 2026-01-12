/**
 * Resume Focus Session
 *
 * 恢复专注会话用例
 */

import type { IGoalFocusApiClient } from '@dailyuse/infrastructure-client';
import type { FocusSessionClientDTO } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Resume Focus Session Use Case
 */
export class ResumeFocusSession {
  private static instance: ResumeFocusSession;

  private constructor(private readonly apiClient: IGoalFocusApiClient) {}

  static createInstance(apiClient?: IGoalFocusApiClient): ResumeFocusSession {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getFocusApiClient();
    ResumeFocusSession.instance = new ResumeFocusSession(client);
    return ResumeFocusSession.instance;
  }

  static getInstance(): ResumeFocusSession {
    if (!ResumeFocusSession.instance) {
      ResumeFocusSession.instance = ResumeFocusSession.createInstance();
    }
    return ResumeFocusSession.instance;
  }

  static resetInstance(): void {
    ResumeFocusSession.instance = undefined as unknown as ResumeFocusSession;
  }

  async execute(): Promise<FocusSessionClientDTO> {
    return this.apiClient.resumeSession();
  }
}
