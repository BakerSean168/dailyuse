import type { PrismaClient } from '@memoflow/database';
import { createScheduleModule, type ScheduleModuleInstance } from './schedule.module';
import { ScheduleEventDeliveryLogConsumer } from './consumers/schedule-event-delivery-log.consumer';
import {
  ScheduleExecutionPrismaRepository,
  SchedulePrismaRepository,
  ScheduleTaskPrismaRepository,
} from './adapters/prisma';
import { createScheduleLeasePrismaRepository } from './lease/schedule-lease.repository';
import { ScheduleLeaseCoordinator } from './lease/schedule-lease-coordinator';
import type { ScheduleRuntimeContributionsInput } from './schedule.module';
import { eventBus } from '@memoflow/utils/domain';

export interface CreateSchedulePrismaModuleOptions {
  readonly runtimeContributions?: ScheduleRuntimeContributionsInput;
  readonly leaseCoordinator?: ScheduleLeaseCoordinator;
  /**
   * P1-1：装配 ScheduleEventDeliveryLogConsumer（module-owned runtime）。
   * 默认 true——唯一可启动的 Prisma 生产组合根应自带幂等消费边界。
   */
  readonly wireDeliveryLogConsumer?: boolean;
}

export function createSchedulePrismaRepository(db: PrismaClient) {
  return new SchedulePrismaRepository(db);
}

export function createScheduleTaskPrismaRepository(
  db: PrismaClient,
  outboxWriter?: import('@memoflow/patterns').IOutboxWriter,
) {
  return new ScheduleTaskPrismaRepository(db, undefined, outboxWriter);
}

export function createScheduleExecutionPrismaRepository(db: PrismaClient) {
  return new ScheduleExecutionPrismaRepository(db);
}

export function createSchedulePrismaModule(
  db: PrismaClient,
  options: CreateSchedulePrismaModuleOptions = {},
): ScheduleModuleInstance {
  const leaseCoordinator =
    options.leaseCoordinator ??
    new ScheduleLeaseCoordinator(createScheduleLeasePrismaRepository(db));

  const wireDeliveryLogConsumer = options.wireDeliveryLogConsumer ?? true;
  const eventDeliveryLogConsumer = wireDeliveryLogConsumer
    ? new ScheduleEventDeliveryLogConsumer(db, eventBus)
    : undefined;

  return createScheduleModule({
    scheduleRepository: createSchedulePrismaRepository(db),
    scheduleTaskRepository: createScheduleTaskPrismaRepository(db),
    scheduleExecutionRepository: createScheduleExecutionPrismaRepository(db),
    leaseCoordinator,
    eventDeliveryLogConsumer,
    runtimeContributions: options.runtimeContributions,
  });
}
