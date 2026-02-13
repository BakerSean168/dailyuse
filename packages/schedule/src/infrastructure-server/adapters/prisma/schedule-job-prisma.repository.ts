/**
 * ScheduleJobPrismaRepository
 * Prisma implementation of IScheduleJobRepository
 *
 * @module Schedule/Infrastructure
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IScheduleJobRepository } from '../../../domain-server/repositories/IScheduleJobRepository';
import type { ScheduleJobServerDTO } from '@dailyuse/contracts/schedule';

export class ScheduleJobPrismaRepository implements IScheduleJobRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToDTO(data: any): ScheduleJobServerDTO {
    return {
      id: data.id,
      identityId: data.identityId,
      nextRunAt: data.nextRunAt instanceof Date
        ? data.nextRunAt.toISOString()
        : data.nextRunAt,
      cronExpression: data.cronExpression ?? null,
      sourceModule: data.sourceModule,
      sourceId: data.sourceId,
      triggerEvent: data.triggerEvent,
      payload: data.payload ? JSON.parse(data.payload) : null,
    };
  }

  async save(job: ScheduleJobServerDTO): Promise<void> {
    await this.prisma.scheduleJob.upsert({
      where: { id: job.id },
      create: {
        id: job.id,
        identityId: job.identityId,
        nextRunAt: new Date(job.nextRunAt),
        cronExpression: job.cronExpression,
        sourceModule: job.sourceModule,
        sourceId: job.sourceId,
        triggerEvent: job.triggerEvent,
        payload: job.payload ? JSON.stringify(job.payload) : null,
      },
      update: {
        nextRunAt: new Date(job.nextRunAt),
        cronExpression: job.cronExpression,
        sourceModule: job.sourceModule,
        sourceId: job.sourceId,
        triggerEvent: job.triggerEvent,
        payload: job.payload ? JSON.stringify(job.payload) : null,
      },
    });
  }

  async findByUuid(uuid: string): Promise<ScheduleJobServerDTO | null> {
    const data = await this.prisma.scheduleJob.findUnique({
      where: { id: uuid },
    });
    return data ? this.mapToDTO(data) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<ScheduleJobServerDTO[]> {
    const data = await this.prisma.scheduleJob.findMany({
      where: { identityId: accountUuid },
      orderBy: { nextRunAt: 'asc' },
    });
    return data.map((item: any) => this.mapToDTO(item));
  }

  async findBySource(
    sourceModule: string,
    sourceId: string,
  ): Promise<ScheduleJobServerDTO[]> {
    const data = await this.prisma.scheduleJob.findMany({
      where: { sourceModule, sourceId },
      orderBy: { nextRunAt: 'asc' },
    });
    return data.map((item: any) => this.mapToDTO(item));
  }

  async findDueJobs(beforeTime: Date): Promise<ScheduleJobServerDTO[]> {
    const data = await this.prisma.scheduleJob.findMany({
      where: {
        nextRunAt: { lte: beforeTime },
      },
      orderBy: { nextRunAt: 'asc' },
    });
    return data.map((item: any) => this.mapToDTO(item));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.scheduleJob.delete({
      where: { id: uuid },
    });
  }

  async deleteBySource(
    sourceModule: string,
    sourceId: string,
  ): Promise<void> {
    await this.prisma.scheduleJob.deleteMany({
      where: { sourceModule, sourceId },
    });
  }
}
