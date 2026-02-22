import type { IScheduleExecutionRepository } from '../../../domain-server/repositories/IScheduleExecutionRepository';
import { ScheduleExecution } from '../../../domain-server/entities/schedule-execution';
import type { PrismaClient } from '@dailyuse/database';
import type { ExecutionStatus } from '@dailyuse/contracts/schedule';
import { PrismaScheduleExecutionMapper } from '../../mappers/prisma-schedule-execution-mapper';

export class ScheduleExecutionPrismaRepository implements IScheduleExecutionRepository {
  constructor(private prisma: PrismaClient) {}

  async save(execution: ScheduleExecution): Promise<void> {
    const data = PrismaScheduleExecutionMapper.toCreateInput(execution);

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
    return data ? PrismaScheduleExecutionMapper.toDomain(data) : null;
  }

  async findByTaskId(taskId: string): Promise<ScheduleExecution[]> {
    const data = await this.prisma.scheduleExecution.findMany({
      where: { taskId },
      orderBy: { executionTime: 'desc' },
    });
    return data.map((d) => PrismaScheduleExecutionMapper.toDomain(d));
  }
}
