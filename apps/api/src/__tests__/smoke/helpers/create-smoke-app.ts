/**
 * Smoke Test App Factory
 *
 * Builds a minimal Express app with Task routes backed by mock repositories.
 * Does NOT import from apps/api bootstrap (avoids env validation side-effects).
 *
 * Architecture:
 *   Mock Repos -> Real Use Cases -> Real Controllers -> Real Routes -> Express
 *
 * This tests the full HTTP pipeline:
 *   supertest -> Express -> auth MW -> expressAdapter -> controller -> use case -> mock repo
 */

import express, { Router, type Express, type RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { vi } from 'vitest';

// Use barrel exports — these resolve via `exports` field in package.json
import type {
  ITaskTemplateRepository,
  ITaskInstanceRepository,
} from '@dailyuse/task/domain-server';
import {
  CreateTaskTemplate,
  GetTaskTemplate,
  ListTaskTemplates,
  UpdateTaskTemplate,
  DeleteTaskTemplate,
  ActivateTaskTemplate,
  PauseTaskTemplate,
  ArchiveTaskTemplate,
  GetTaskInstance,
  ListTaskInstancesByAccount,
  ListTaskInstancesByTemplate,
  ListTaskInstancesByStatus,
  GetTaskInstancesByDateRange,
  CompleteTaskInstance,
  SkipTaskInstance,
  StartTaskInstance,
  DeleteTaskInstance,
} from '@dailyuse/task/application-server';

// Controllers and routes are NOT exported from the api barrel,
// so we import them via deep paths (resolved by the taskDeepImportResolver plugin)
import { TaskTemplateController } from '@dailyuse/task/api/controllers/task-template.controller';
import { TaskInstanceController } from '@dailyuse/task/api/controllers/task-instance.controller';
import { registerTaskRoutes } from '@dailyuse/task/api/routes';

// ============================================================================
// Constants
// ============================================================================

export const JWT_SECRET = 'smoke-test-jwt-secret-key-at-least-32-chars';
export const TEST_IDENTITY_ID = 'IdentityId_smoke-user-0001';

// ============================================================================
// Mock Repository Factory
// ============================================================================

/**
 * Create a mock ITaskTemplateRepository with all methods as vi.fn()
 */
export function createMockTemplateRepo(): ITaskTemplateRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByIdWithChildren: vi.fn().mockResolvedValue(null),
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

/**
 * Create a mock ITaskInstanceRepository with all methods as vi.fn()
 */
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
    deleteIncompleteInstancesFrom: vi.fn().mockResolvedValue(0),
  };
}

// ============================================================================
// Auth Helper
// ============================================================================

/**
 * Create a signed JWT for smoke test requests
 */
export function createTestToken(identityId = TEST_IDENTITY_ID): string {
  return jwt.sign({ identityId }, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Lightweight auth middleware that verifies JWT using the test secret
 */
const smokeAuthMiddleware: RequestHandler = (req: any, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, code: 401, message: 'Missing token' });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = { identityId: decoded.identityId };
    return next();
  } catch {
    return res.status(401).json({ ok: false, code: 401, message: 'Invalid token' });
  }
};

// ============================================================================
// App Factory
// ============================================================================

export interface SmokeTestApp {
  app: Express;
  templateRepo: ITaskTemplateRepository;
  instanceRepo: ITaskInstanceRepository;
  token: string;
}

/**
 * Create a minimal Express app with Task routes backed by mock repositories.
 *
 * Returns the app, mock repos (for configuring test responses), and a pre-signed JWT token.
 */
export function createSmokeApp(): SmokeTestApp {
  const templateRepo = createMockTemplateRepo();
  const instanceRepo = createMockInstanceRepo();

  // Wire use cases with mock repos (same as TaskModule constructor)
  const templateController = new TaskTemplateController({
    createTemplate: new CreateTaskTemplate(templateRepo, instanceRepo),
    getTemplate: new GetTaskTemplate(templateRepo),
    listTemplates: new ListTaskTemplates(templateRepo, instanceRepo),
    updateTemplate: new UpdateTaskTemplate(templateRepo),
    deleteTemplate: new DeleteTaskTemplate(templateRepo, instanceRepo),
    activateTemplate: new ActivateTaskTemplate(templateRepo, instanceRepo),
    pauseTemplate: new PauseTaskTemplate(templateRepo, instanceRepo),
    archiveTemplate: new ArchiveTaskTemplate(templateRepo),
  });

  const instanceController = new TaskInstanceController({
    getTaskInstance: new GetTaskInstance(instanceRepo),
    listByAccount: new ListTaskInstancesByAccount(instanceRepo),
    listByTemplate: new ListTaskInstancesByTemplate(instanceRepo),
    listByStatus: new ListTaskInstancesByStatus(instanceRepo),
    getByDateRange: new GetTaskInstancesByDateRange(instanceRepo),
    complete: new CompleteTaskInstance(instanceRepo),
    skip: new SkipTaskInstance(instanceRepo),
    start: new StartTaskInstance(instanceRepo),
    deleteInstance: new DeleteTaskInstance(instanceRepo),
  });

  // Build Express app
  const app = express();
  app.use(express.json());

  const rootRouter = Router();
  const middleware = {
    auth: smokeAuthMiddleware,
    requireRole: (_roles: string[]) => smokeAuthMiddleware,
  };

  registerTaskRoutes({ templateController, instanceController }, middleware, rootRouter);

  app.use('/api/v1', rootRouter);

  // Basic error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(500).json({ ok: false, code: 500, message: err.message || 'Internal error' });
  });

  return {
    app,
    templateRepo,
    instanceRepo,
    token: createTestToken(),
  };
}
