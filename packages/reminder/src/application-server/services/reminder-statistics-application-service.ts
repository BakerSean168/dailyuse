import type {
  IReminderStatisticsRepository,
} from '@/domain-server';
import type { ReminderStatisticsClientDTO } from '@dailyuse/contracts/reminder';

export class ReminderStatisticsApplicationService {
  constructor(private reminderStatisticsRepository: IReminderStatisticsRepository) {}

  async getStatistics(accountUuid: string): Promise<ReminderStatisticsClientDTO | null> {
    const stats = await this.reminderStatisticsRepository.findByAccountUuid(accountUuid);
    return stats ? stats.toClientDTO() : null;
  }
}
