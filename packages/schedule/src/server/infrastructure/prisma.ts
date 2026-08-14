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
import type {
  ScheduleRuntimeContributionsInput,
  ScheduleModuleRuntimeContribution,
} from './schedule.module';
import { eventBus } from '@memoflow/utils/domain';
import { PrismaOperationAuditRepository, globalUnifiedOperationMetrics } from '@memoflow/patterns/operations';
import type { OperationAuditRepository } from '@memoflow/patterns/operations';
import type {
  IScheduleRepository,
  IScheduleExecutionRepository,
  IScheduleTaskRepository,
} from '../domain';

export interface CreateSchedulePrismaModuleOptions {
  readonly runtimeContributions?: ScheduleRuntimeContributionsInput;
  readonly leaseCoordinator?: ScheduleLeaseCoordinator;
  /**
   * P1-1：装配 ScheduleEventDeliveryLogConsumer（module-owned runtime）。
   * 默认 true——唯一可启动的 Prisma 生产组合根应自带幂等消费边界。
   */
  readonly wireDeliveryLogConsumer?: boolean;
}

/**
 * Options accepted by the Prisma schedule ingredient factory.
 * Prisma schedule 原料工厂接受的选项。
 */
export interface CreateSchedulePrismaRepositoriesOptions {
  /**
   * R1-2：事件总线失败时的 durable outbox 兜底（merge-base `createScheduleTaskPrismaRepository(db, outboxWriter)` 行为）。
   * 提供时调度任务仓储的事件发布失败会落入可靠 outbox（可重试/对账）。
   */
  readonly outboxWriter?: import('@memoflow/patterns').IOutboxWriter;
}

/**
 * Host-facing schedule repository set.
 * 面向宿主暴露的调度仓储集合。
 *
 * Shared lane-capable shape returned by both the Prisma and the PowerSync
 * ingredient factories: the three schedule repositories, the lease coordinator
 * and (Prisma only) the operation audit repository. Hosts select the lane
 * without importing any concrete adapter.
 *
 * Prisma 与 PowerSync 两个原料工厂返回的共享 lane 可承载形状：三个调度仓储、
 * lease coordinator 与（仅 Prisma）操作审计仓储。宿主无需导入任何具体适配器即可选择 lane。
 */
export interface ScheduleRepositorySet {
  readonly scheduleRepository: IScheduleRepository;
  readonly scheduleExecutionRepository: IScheduleExecutionRepository;
  readonly scheduleTaskRepository: IScheduleTaskRepository;
  readonly leaseCoordinator: ScheduleLeaseCoordinator;
  readonly auditRepository?: OperationAuditRepository;
  /**
   * Prisma-lane production consumer（P1-1）。由 `createSchedulePrismaRepositories`
   * 构建并随模块 start()/dispose() 启停；结构化运行时贡献形状，具体 consumer 类
   * 保持在包内。
   */
  readonly eventDeliveryLogConsumer?: ScheduleModuleRuntimeContribution;
}

export function createSchedulePrismaRepository(db: PrismaClient) {
  return new SchedulePrismaRepository(db, undefined, globalUnifiedOperationMetrics);
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

/**
 * Creates Prisma-backed schedule repositories.
 * 创建基于 Prisma 的调度仓储。
 *
 * Host-level composition ingredient: selects the Prisma adapters and returns
 * the lane-capable repository Port shape, including the lease coordinator
 * (used for the two-phase host assembly where orchestration needs
 * `scheduleTaskRepository` before a `sourceExecutor` exists).
 *
 * 宿主级组合原料：选择 Prisma 适配器并返回 lane 可承载的仓储 Port 形状，
 * 包含 lease coordinator（用于两阶段宿主装配——编排在 `sourceExecutor` 存在前
 * 就需要 `scheduleTaskRepository`）。
 *
 * @param db - Prisma client owned by the host runtime. 宿主运行时持有的 Prisma client。
 * @returns Repository set backed by the Prisma adapters.
 *          返回基于 Prisma 适配器的仓储集合。
 */
export function createSchedulePrismaRepositories(
  db: PrismaClient,
  options: CreateSchedulePrismaRepositoriesOptions = {},
): ScheduleRepositorySet {
  const eventDeliveryLogConsumer = new ScheduleEventDeliveryLogConsumer(db, eventBus);
  return {
    scheduleRepository: createSchedulePrismaRepository(db),
    scheduleExecutionRepository: createScheduleExecutionPrismaRepository(db),
    scheduleTaskRepository: createScheduleTaskPrismaRepository(db, options.outboxWriter),
    leaseCoordinator: new ScheduleLeaseCoordinator(createScheduleLeasePrismaRepository(db)),
    auditRepository: new PrismaOperationAuditRepository(db),
    eventDeliveryLogConsumer,
  };
}

export function createSchedulePrismaModule(
  db: PrismaClient,
  options: CreateSchedulePrismaModuleOptions = {},
): ScheduleModuleInstance {
  const repositories = createSchedulePrismaRepositories(db);

  const wireDeliveryLogConsumer = options.wireDeliveryLogConsumer ?? true;
  const eventDeliveryLogConsumer = wireDeliveryLogConsumer
    ? repositories.eventDeliveryLogConsumer
    : undefined;

  return createScheduleModule({
    scheduleRepository: repositories.scheduleRepository,
    scheduleTaskRepository: repositories.scheduleTaskRepository,
    scheduleExecutionRepository: repositories.scheduleExecutionRepository,
    leaseCoordinator: options.leaseCoordinator ?? repositories.leaseCoordinator,
    eventDeliveryLogConsumer,
    runtimeContributions: options.runtimeContributions,
    auditRepository: repositories.auditRepository,
  });
}
