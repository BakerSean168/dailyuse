import type {
  IReminderStatisticsRepository,
} from '@dailyuse/domain-server/reminder';
import type { ReminderStatisticsClientDTO } from '@dailyuse/contracts/reminder';

export class ReminderStatisticsApplicationService {
  constructor(private reminderStatisticsRepository: IReminderStatisticsRepository) {}

  async getStatistics(accountUuid: string): Promise<ReminderStatisticsClientDTO | null> {
    const stats = await this.reminderStatisticsRepository.findByAccountUuid(accountUuid);
    return stats ? stats.toClientDTO() : null;
  }
}
