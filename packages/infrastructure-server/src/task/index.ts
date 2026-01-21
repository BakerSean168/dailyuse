/**
 * Task Module - Infrastructure Server
 *
 * Repository implementations and DI Module for Task module.
 */

// Module
export { TaskModule } from './task.module';

// Repositories (Prisma implementations)
export {
  PrismaTaskInstanceRepository,
  PrismaTaskTemplateRepository,
  PrismaTaskDependencyRepository,
  PrismaTaskStatisticsRepository,
} from './repositories';
