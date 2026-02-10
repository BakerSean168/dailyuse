/**
 * Start Focus Session
 *
 * 开始专注会话用例
 */

import type { IGoalFocusApiClient } from '@/infrastructure-client';
import type { FocusSessionClientDTO, StartFocusRequest } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Start Focus Session Use Case
 */
export class StartFocusSession {
  private static instance: StartFocusSession;

  private constructor(private readonly apiClient: IGoalFocusApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalFocusApiClient): StartFocusSession {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getFocusApiClient();
    StartFocusSession.instance = new StartFocusSession(client);
    return StartFocusSession.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): StartFocusSession {
    if (!StartFocusSession.instance) {
      StartFocusSession.instance = StartFocusSession.createInstance();
    }
    return StartFocusSession.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    StartFocusSession.instance = undefined as unknown as StartFocusSession;
  }

  /**
   * 执行用例
   */
  async execute(request: StartFocusRequest): Promise<FocusSessionClientDTO> {
    return this.apiClient.startSession(request);
  }
}
