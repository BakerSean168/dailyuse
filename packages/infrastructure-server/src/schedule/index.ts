/**
 * Schedule Module - Infrastructure Server
 *
 * Repository implementations and DI Module for Schedule module.
 */

// DI Module
export { ScheduleModule } from './schedule.module';

// Adapters
export { SchedulePrismaRepository } from './adapters/prisma/schedule-prisma.repository';
export { ScheduleTaskPrismaRepository } from './adapters/prisma/schedule-task-prisma.repository';
export { ScheduleExecutionPrismaRepository } from './adapters/prisma/schedule-execution-prisma.repository';
export { ScheduleStatisticsPrismaRepository } from './adapters/prisma/schedule-statistics-prisma.repository';
export { SqliteScheduleRepository } from './adapters/sqlite/schedule-sqlite.repository';
export { SqliteScheduleTaskRepository } from './adapters/sqlite/schedule-task-sqlite.repository';
export { SqliteScheduleExecutionRepository } from './adapters/sqlite/schedule-execution-sqlite.repository';
export { SqliteScheduleStatisticsRepository } from './adapters/sqlite/schedule-statistics-sqlite.repository';

// Datasources (External integrations)
export {
  CronJobManager,
  // BreeExecutionEngine, // TODO: Fix bree dependency
  // ScheduleMonitor, // TODO: Fix ScheduleMonitor
  // PrismaScheduleExecutionMapper, // TODO: Fix PrismaScheduleExecutionMapper
} from './datasources';

export { SchedulerBootstrap } from './scheduler-bootstrap';


