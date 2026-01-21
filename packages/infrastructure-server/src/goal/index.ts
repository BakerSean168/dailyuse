/**
 * Goal Module - Infrastructure Server
 *
 * Ports and Adapters for Goal module persistence.
 */

// Container
export { GoalContainer } from './goal.container';
export { GoalModule } from './goal.module';


// Ports (Interfaces)
export { type IGoalRepository } from './ports/goal-repository.port';

// Prisma Adapters
export { GoalPrismaRepository } from './adapters/prisma/goal-prisma.repository';

// Memory Adapters
export { GoalMemoryRepository } from './adapters/memory/goal-memory.repository';

// Prisma Weight Snapshot
export { PrismaWeightSnapshotMapper } from './mappers/prisma-weight-snapshot-mapper';
export { PrismaWeightSnapshotRepository } from './adapters/prisma/weight-snapshot-prisma.repository';
