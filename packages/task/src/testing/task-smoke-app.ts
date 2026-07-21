/**
 * Task smoke app helpers.
 *
 * Provides a reusable smoke-test composition root for host integration tests
 * without exposing the full application-server public surface.
 */

import express, { Router, type Express, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { vi } from 'vitest';
import { TaskTemplateController } from '../server/transport/task-template.controller';
import { TaskInstanceController } from '../server/transport/task-instance.controller';
import { TaskDependencyController } from '../server/transport/task-dependency.controller';
import {
  createTaskModule,
  type TaskModuleDependencies,
} from '../server/infrastructure/task.module';
import { createTaskTransportHandlers } from '../server/transport';
import { registerTaskRoutes } from '../api/routes';
import type {
  ITaskTemplateRepository,
} from '../server/domain/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '../server/domain/repositories/i-task-instance-repository';
import type { ITaskDependencyRepository } from '../server/domain/repositories/i-task-dependency-repository';

export const JWT_SECRET = 'smoke-test-jwt-secret-key-at-least-32-chars';
export const TEST_IDENTITY_ID = 'IdentityId_550e8400-e29b-41d4-a716-446655440001';

export interface TaskSmokeApp {
  app: Express;
  templateRepo: ITaskTemplateRepository;
  instanceRepo: ITaskInstanceRepository;
  dependencyRepo: ITaskDependencyRepository;
  token: string;
}

export function createMockTemplateRepo(): ITaskTemplateRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByIdForIdentity: vi.fn().mockResolvedValue(null),
    findByIdWithChildren: vi.fn().mockResolvedValue(null),
    findByIdWithChildrenForIdentity: vi.fn().mockResolvedValue(null),
    findByIdentityId: vi.fn().mockResolvedValue([]),
    findByStatus: vi.fn().mockResolvedValue([]),
    findActiveTemplates: vi.fn().mockResolvedValue([]),
    findByFolderId: vi.fn().mockResolvedValue([]),
    findByGoalId: vi.fn().mockResolvedValue([]),
    findByTags: vi.fn().mockResolvedValue([]),
    findNeedGenerateInstances: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
    findOneTimeTasks: vi.fn().mockResolvedValue([]),
    findRecurringTasks: vi.fn().mockResolvedValue([]),
    findOverdueTasks: vi.fn().mockResolvedValue([]),
    findByKeyResultId: vi.fn().mockResolvedValue([]),
    findSubtasks: vi.fn().mockResolvedValue([]),
    findBlockedTasks: vi.fn().mockResolvedValue([]),
    findSortedByPriority: vi.fn().mockResolvedValue([]),
    findUpcomingTasks: vi.fn().mockResolvedValue([]),
    findTodayTasks: vi.fn().mockResolvedValue([]),
    countTasks: vi.fn().mockResolvedValue(0),
    saveBatch: vi.fn().mockResolvedValue(undefined),
    deleteBatch: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockInstanceRepo(): ITaskInstanceRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    saveMany: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByTemplateId: vi.fn().mockResolvedValue([]),
    findByIdentityId: vi.fn().mockResolvedValue([]),
    findByDateRange: vi.fn().mockResolvedValue([]),
    findByStatus: vi.fn().mockResolvedValue([]),
    findOverdueInstances: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    deleteMany: vi.fn().mockResolvedValue(undefined),
    deleteByTemplateId: vi.fn().mockResolvedValue(undefined),
    countFutureInstances: vi.fn().mockResolvedValue(0),
    findByTemplateIdAndDateRange: vi.fn().mockResolvedValue([]),
    getTemplateStats: vi.fn().mockResolvedValue({}),
    deleteIncompleteInstancesFrom: vi.fn().mockResolvedValue(0),
  };
}

export function createMockDependencyRepo(): ITaskDependencyRepository {
  return {
    create: vi.fn().mockResolvedValue(null as never),
    findById: vi.fn().mockResolvedValue(null),
    findBySuccessorId: vi.fn().mockResolvedValue([]),
    findByPredecessorId: vi.fn().mockResolvedValue([]),
    findByPredecessorAndSuccessorId: vi.fn().mockResolvedValue(null),
    findAllPredecessorIds: vi.fn().mockResolvedValue([]),
    findAllSuccessorIds: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    deleteAggregate: vi.fn().mockResolvedValue(undefined),
    findAggregateById: vi.fn().mockResolvedValue(null),
    deleteByTaskId: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(null as never),
    findAllByIdentityId: vi.fn().mockResolvedValue([]),
  };
}

export function createTestToken(identityId = TEST_IDENTITY_ID): string {
  return jwt.sign({ identityId }, JWT_SECRET, { expiresIn: '1h' });
}

const smokeAuthMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, code: 401, message: 'Missing token' });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as unknown as Record<string, unknown>).user = { identityId: decoded.identityId };
    return next();
  } catch {
    return res.status(401).json({ ok: false, code: 401, message: 'Invalid token' });
  }
};

export function createTaskSmokeApp(): TaskSmokeApp {
  const templateRepo = createMockTemplateRepo();
  const instanceRepo = createMockInstanceRepo();
  const dependencyRepo = createMockDependencyRepo();
  const taskModule = createTaskModule({
    taskTemplateRepository: templateRepo,
    taskInstanceRepository: instanceRepo,
    taskDependencyRepository: dependencyRepo,
  } satisfies TaskModuleDependencies);
  const handlers = createTaskTransportHandlers(taskModule.api);

  const templateController = new TaskTemplateController(handlers.template);
  const instanceController = new TaskInstanceController(handlers.instance);
  const dependencyController = new TaskDependencyController(handlers.dependency);

  const app = express();
  app.use(express.json());

  const rootRouter = Router();
  const taskRoutes = registerTaskRoutes(
    { templateController, instanceController, dependencyController },
    {
      auth: smokeAuthMiddleware,
      requireRole: (_roles: string[]) => smokeAuthMiddleware,
    },
  );
  rootRouter.use(taskRoutes);

  app.use('/api/v1', rootRouter);
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ ok: false, code: 500, message: err.message || 'Internal error' });
  });

  return {
    app,
    templateRepo,
    instanceRepo,
    dependencyRepo,
    token: createTestToken(),
  };
}
