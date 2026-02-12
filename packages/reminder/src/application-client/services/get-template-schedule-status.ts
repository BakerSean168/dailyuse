/**
 * Get Template Schedule Status
 *
 * 获取模板的调度状态用例
 */

import type { IReminderApiClient } from '../../infrastructure-client/adapters/types';
import type { TemplateScheduleStatusDTO } from '@dailyuse/contracts/reminder';
import { ReminderContainer } from '../../infrastructure-client/reminder.container';

/**
 * Get Template Schedule Status
 */
export class GetTemplateScheduleStatus {
  private static instance: GetTemplateScheduleStatus;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): GetTemplateScheduleStatus {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetTemplateScheduleStatus.instance = new GetTemplateScheduleStatus(client);
    return GetTemplateScheduleStatus.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetTemplateScheduleStatus {
    if (!GetTemplateScheduleStatus.instance) {
      GetTemplateScheduleStatus.instance = GetTemplateScheduleStatus.createInstance();
    }
    return GetTemplateScheduleStatus.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetTemplateScheduleStatus.instance = undefined as unknown as GetTemplateScheduleStatus;
  }

  /**
   * 执行用例
   */
  async execute(templateUuid: string): Promise<TemplateScheduleStatusDTO> {
    return this.apiClient.getTemplateScheduleStatus(templateUuid);
  }
}

/**
 * 便捷函数
 */
export const getTemplateScheduleStatus = (templateUuid: string): Promise<TemplateScheduleStatusDTO> =>
  GetTemplateScheduleStatus.getInstance().execute(templateUuid);
