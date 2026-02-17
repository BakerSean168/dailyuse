import type { IScheduleExecutionRepository } from '../../../domain-server/repositories/IScheduleExecutionRepository';
import { ScheduleExecution } from '../../../domain-server/entities/schedule-execution';
import type { PrismaClient } from '@dailyuse/database';

export class ScheduleExecutionPrismaRepository implements IScheduleExecutionRepository {
  constructor(private prisma: PrismaClient) {}

  async save(execution: ScheduleExecution): Promise<void> {
    const dto = execution.toPersistenceDTO();

    const data = {
      id: dto.id,
      taskId: dto.taskId,
      executionTime: new Date(dto.executionTime),
      status: dto.status,
      duration: dto.duration,
      result: dto.result,
      error: dto.error,
      retryCount: dto.retryCount,
      createdAt: new Date(dto.createdAt),
    };

    await this.prisma.scheduleExecution.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }

  async findById(id: string): Promise<ScheduleExecution | null> {
    const data = await this.prisma.scheduleExecution.findUnique({
      where: { id },
    });
    return data ? ScheduleExecution.fromPersistenceDTO(data) : null;
  }

  async findByTaskId(taskId: string): Promise<ScheduleExecution[]> {
    const data = await this.prisma.scheduleExecution.findMany({
      where: { taskId },
      orderBy: { executionTime: 'desc' },
    });
    return data.map((d) => ScheduleExecution.fromPersistenceDTO(d));
  }
}
