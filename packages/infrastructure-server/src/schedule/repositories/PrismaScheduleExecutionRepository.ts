import type { IScheduleExecutionRepository } from '@dailyuse/domain-server/schedule';
import { ScheduleExecution } from '@dailyuse/domain-server/schedule';
import type { PrismaClient, scheduleExecution as PrismaScheduleExecution } from '@prisma/client';

export class PrismaScheduleExecutionRepository implements IScheduleExecutionRepository {
  constructor(private prisma: PrismaClient) {}

  async save(execution: ScheduleExecution): Promise<void> {
    const dto = execution.toPersistenceDTO();

    const data = {
      uuid: dto.uuid,
      taskUuid: dto.taskUuid,
      executionTime: new Date(dto.executionTime),
      status: dto.status,
      duration: dto.duration,
      result: dto.result,
      error: dto.error,
      retryCount: dto.retryCount,
      createdAt: new Date(dto.createdAt),
    };

    await this.prisma.scheduleExecution.upsert({
      where: { uuid: data.uuid },
      update: data,
      create: data,
    });
  }

  async findByUuid(uuid: string): Promise<ScheduleExecution | null> {
    const data = await this.prisma.scheduleExecution.findUnique({
      where: { uuid },
    });
    return data ? ScheduleExecution.fromPersistenceDTO(data) : null;
  }

  async findByTaskUuid(taskUuid: string): Promise<ScheduleExecution[]> {
    const data = await this.prisma.scheduleExecution.findMany({
      where: { taskUuid },
      orderBy: { executionTime: 'desc' },
    });
    return data.map((d) => ScheduleExecution.fromPersistenceDTO(d));
  }
}
