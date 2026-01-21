import type {
  IReminderStatisticsRepository,
} from '@dailyuse/domain-server/reminder';
import type { ReminderStatisticsClientDTO } from '@dailyuse/contracts/reminder';

export class ReminderStatisticsApplicationService {
  constructor(private reminderStatisticsRepository: IReminderStatisticsRepository) {}

  async getStatistics(templateUuid: string): Promise<ReminderStatisticsClientDTO | null> {
    const stats = await this.reminderStatisticsRepository.findByTemplate(templateUuid);
    return stats ? stats.toClientDTO() : null;
  }
}
