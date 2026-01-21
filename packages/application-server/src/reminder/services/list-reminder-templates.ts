/**
 * List Reminder Templates Service
 *
 * 获取提醒模板列表
 */

import type { IReminderTemplateRepository, ReminderTemplate } from '@dailyuse/domain-server/reminder';
import type {
  QueryReminderTemplatesRequest,
  ReminderTemplateListDTO,
} from '@dailyuse/contracts/reminder';
// import { ReminderContainer } from '@dailyuse/infrastructure-server';

/**
 * List Reminder Templates Service
 */
export class ListReminderTemplates {

  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  /**
   * 获取服务单例
   */
  static getInstance(): ListReminderTemplates {
    if (!ListReminderTemplates.instance) {
      ListReminderTemplates.instance = ListReminderTemplates.createInstance();
    }
    return ListReminderTemplates.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListReminderTemplates.instance = undefined as unknown as ListReminderTemplates;
  }

  async execute(accountUuid: string, query?: QueryReminderTemplatesRequest): Promise<ReminderTemplateListDTO> {
    let templates: ReminderTemplate[];

    if (query?.groupUuid) {
      templates = await this.templateRepository.findByGroupUuid(query.groupUuid, {
        includeHistory: false,
      });
    } else if (query?.effectiveEnabled) {
      templates = await this.templateRepository.findActive(accountUuid);
    } else {
      templates = await this.templateRepository.findByAccountUuid(accountUuid, {
        includeHistory: false,
      });
    }

    return {
      templates: templates.map((t) => t.toClientDTO()),
      total: templates.length,
    };
  }
}
