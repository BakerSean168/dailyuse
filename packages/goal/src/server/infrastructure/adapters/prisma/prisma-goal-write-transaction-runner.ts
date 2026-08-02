import type { PrismaClient, Prisma } from '@memoflow/database';
import type { IEventBus } from '@memoflow/patterns';
import type {
  GoalWriteRepositories,
  GoalWriteTransactionRunner,
} from '../../../application/use-cases/commands/goal-write-support';
import {
  BufferedGoalWriteEventBus,
  committedGoalWriteEventBus,
} from '../goal-write-buffered-event-bus';
import { GoalPrismaRepository } from './goal-prisma.repository';
import { GoalRecordPrismaRepository } from './goal-record-prisma.repository';

export class PrismaGoalWriteTransactionRunner implements GoalWriteTransactionRunner {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventPublisher: IEventBus = committedGoalWriteEventBus,
  ) {}

  async run<T>(work: (repositories: GoalWriteRepositories) => Promise<T>): Promise<T> {
    const bufferedEventBus = new BufferedGoalWriteEventBus();
    const result = await this.prisma.$transaction((tx: Prisma.TransactionClient) =>
      work({
        goalRepository: new GoalPrismaRepository(tx, bufferedEventBus, true),
        goalRecordRepository: new GoalRecordPrismaRepository(tx),
      }),
    );
    await bufferedEventBus.flush(this.eventPublisher);
    return result;
  }
}
