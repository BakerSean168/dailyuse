/**
 * Goal API Routes
 *
 * 路由定义与请求处理。
 * 中间件通过参数注入（来自 ApiBootstrapper 上下文），
 * 不直接依赖 apps/api 内部实现。
 *
 * Routes:
 *   POST   /goals              — 创建目标
 *   GET    /goals              — 查询目标列表
 *   GET    /goals/search       — 搜索目标
 *   GET    /goals/:id          — 获取目标详情
 *   PUT    /goals/:id          — 更新目标
 *   DELETE /goals/:id          — 删除目标（软删除）
 *   POST   /goals/:id/archive  — 归档目标
 *   POST   /goals/:id/activate — 激活目标
 *   POST   /goals/:id/complete — 完成目标 (TODO)
 *
 *   POST   /goals/:id/key-results              — 添加关键结果
 *   PUT    /goals/:id/key-results/:krId         — 更新关键结果
 *   PATCH  /goals/:id/key-results/:krId/progress — 更新关键结果进度
 *   DELETE /goals/:id/key-results/:krId         — 删除关键结果
 *
 *   POST   /goals/:id/reviews  — 添加目标回顾
 */

import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import {
  CreateGoalSchema,
  UpdateGoalSchema,
  QueryGoalsSchema,
  AddKeyResultSchema,
  UpdateKeyResultSchema,
  UpdateKeyResultProgressSchema,
  CreateGoalReviewSchema,
} from '@dailyuse/contracts/goal';
import {
  createResponseBuilder,
  errorCodeToHttpStatus,
  isOk,
  type Result,
  type ResultErrorDetail,
} from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils';
import type {
  CreateGoal,
  GetGoal,
  ListGoals,
  UpdateGoal,
  DeleteGoal,
  ArchiveGoal,
  ActivateGoal,
  SearchGoals,
  AddGoalKeyResult,
  UpdateGoalKeyResult,
  UpdateGoalKeyResultProgress,
  DeleteGoalKeyResult,
  AddGoalReview,
} from '../application-server';

const logger = createLogger('GoalRoutes');

// ============ Types ============

export interface GoalRouteHandlers {
  createGoal: CreateGoal;
  getGoal: GetGoal;
  listGoals: ListGoals;
  updateGoal: UpdateGoal;
  deleteGoal: DeleteGoal;
  archiveGoal: ArchiveGoal;
  activateGoal: ActivateGoal;
  searchGoals: SearchGoals;
  addKeyResult: AddGoalKeyResult;
  updateKeyResult: UpdateGoalKeyResult;
  updateKeyResultProgress: UpdateGoalKeyResultProgress;
  deleteKeyResult: DeleteGoalKeyResult;
  addReview: AddGoalReview;
}

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

interface AuthenticatedRequest extends Request {
  user?: {
    identityId: string;
    sessionId?: string;
    tokenType?: string;
    exp?: number;
  };
}

// ============ Helpers ============

const responseBuilder = createResponseBuilder();

function getIdentityId(req: AuthenticatedRequest): string | null {
  return req.user?.identityId ?? null;
}

function respondWithResult<T>(res: Response, result: Result<T>, okStatus = 200) {
  if (isOk(result as any)) {
    res.status(okStatus).json(responseBuilder.success(result.data as T));
    return;
  }

  const status = errorCodeToHttpStatus(result.error?.code ?? 'INTERNAL_ERROR');
  res.status(status).json(responseBuilder.fromResult(result as any));
}

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function parseStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return undefined;
}

// ============ Route Registration ============

export function registerGoalRoutes(
  handlers: GoalRouteHandlers,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;

  // ==================== Goal CRUD ====================

  // POST / — 创建目标
  router.post('/', auth, async (req: AuthenticatedRequest, res: Response) => {
    const parsed = CreateGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        code: 'INVALID_FIELD' as const,
        message: issue.message,
      }));
      res.status(400).json(responseBuilder.validationError(details));
      return;
    }

    const identityId = getIdentityId(req);
    if (!identityId) {
      res.status(401).json(responseBuilder.unauthorized());
      return;
    }

    const result = await handlers.createGoal.execute(parsed.data, { identityId });
    respondWithResult(res, result, 201);
  });

  // GET / — 查询目标列表
  router.get('/', auth, async (req: AuthenticatedRequest, res: Response) => {
    const identityId = getIdentityId(req);
    if (!identityId) {
      res.status(401).json(responseBuilder.unauthorized());
      return;
    }

    const parsed = QueryGoalsSchema.safeParse({
      identityId: identityId,
      status: parseStringArray(req.query.status),
      importance: parseStringArray(req.query.importance),
      category: req.query.category,
      tags: parseStringArray(req.query.tags),
      folderId: req.query.folderId,
      keyword: req.query.keyword,
      startDate: parseNumber(req.query.startDate),
      endDate: parseNumber(req.query.endDate),
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      page: parseNumber(req.query.page),
      pageSize: parseNumber(req.query.pageSize),
      includeKeyResults: parseBoolean(req.query.includeKeyResults),
      includeReviews: parseBoolean(req.query.includeReviews),
    });

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        code: 'INVALID_FIELD' as const,
        message: issue.message,
      }));
      res.status(400).json(responseBuilder.validationError(details));
      return;
    }

    const result = await handlers.listGoals.execute(parsed.data);
    respondWithResult(res, result);
  });

  // GET /search — 搜索目标
  router.get('/search', auth, async (req: AuthenticatedRequest, res: Response) => {
    const identityId = getIdentityId(req);
    if (!identityId) {
      res.status(401).json(responseBuilder.unauthorized());
      return;
    }

    const query = typeof req.query.q === 'string' ? req.query.q : '';
    if (!query.trim()) {
      res.status(400).json(
        responseBuilder.error('VALIDATION_ERROR', 'Search query (q) is required'),
      );
      return;
    }

    const result = await handlers.searchGoals.execute(identityId, query);
    respondWithResult(res, result);
  });

  // GET /:id — 获取目标详情
  router.get('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const includeChildren = parseBoolean(req.query.includeChildren) ?? true;
    const result = await handlers.getGoal.execute(req.params.id, includeChildren);
    respondWithResult(res, result);
  });

  // PUT /:id — 更新目标
  router.put('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const parsed = UpdateGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        code: 'INVALID_FIELD' as const,
        message: issue.message,
      }));
      res.status(400).json(responseBuilder.validationError(details));
      return;
    }

    const result = await handlers.updateGoal.execute(req.params.id, parsed.data);
    respondWithResult(res, result);
  });

  // PATCH /:id — 更新目标（别名）
  router.patch('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const parsed = UpdateGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        code: 'INVALID_FIELD' as const,
        message: issue.message,
      }));
      res.status(400).json(responseBuilder.validationError(details));
      return;
    }

    const result = await handlers.updateGoal.execute(req.params.id, parsed.data);
    respondWithResult(res, result);
  });

  // DELETE /:id — 删除目标（软删除）
  router.delete('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const result = await handlers.deleteGoal.execute(req.params.id);
    respondWithResult(res, result);
  });

  // ==================== Goal Status Operations ====================

  // POST /:id/archive — 归档目标
  router.post('/:id/archive', auth, async (req: AuthenticatedRequest, res: Response) => {
    const result = await handlers.archiveGoal.execute(req.params.id);
    respondWithResult(res, result);
  });

  // POST /:id/activate — 激活目标
  router.post('/:id/activate', auth, async (req: AuthenticatedRequest, res: Response) => {
    const result = await handlers.activateGoal.execute(req.params.id);
    respondWithResult(res, result);
  });

  // ==================== Key Result Routes ====================

  // POST /:id/key-results — 添加关键结果
  router.post('/:id/key-results', auth, async (req: AuthenticatedRequest, res: Response) => {
    const parsed = AddKeyResultSchema.safeParse({
      ...req.body,
      goalId: req.params.id,
    });
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        code: 'INVALID_FIELD' as const,
        message: issue.message,
      }));
      res.status(400).json(responseBuilder.validationError(details));
      return;
    }

    const result = await handlers.addKeyResult.execute(
        req.params.id,
        {
          title: parsed.data.title,
          valueType: parsed.data.valueType as any,
          aggregationMethod: parsed.data.calculationMethod as any,
          targetValue: parsed.data.targetValue,
          currentValue: parsed.data.currentValue,
          unit: parsed.data.unit,
          weight: parsed.data.weight,
        },
      );
    respondWithResult(res, result, 201);
  });

  // PUT /:id/key-results/:krId — 更新关键结果
  router.put(
    '/:id/key-results/:krId',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const parsed = UpdateKeyResultSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          code: 'INVALID_FIELD' as const,
          message: issue.message,
        }));
        res.status(400).json(responseBuilder.validationError(details));
        return;
      }

      const result = await handlers.updateKeyResult.execute(
          req.params.id,
          req.params.krId,
          {
            title: parsed.data.title,
            description: parsed.data.description ?? undefined,
            weight: parsed.data.weight,
            targetValue: parsed.data.targetValue,
            unit: parsed.data.unit ?? undefined,
          },
        );
      respondWithResult(res, result);
    },
  );

  // PATCH /:id/key-results/:krId/progress — 更新关键结果进度
  router.patch(
    '/:id/key-results/:krId/progress',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const parsed = UpdateKeyResultProgressSchema.safeParse({
        ...req.body,
        keyResultId: req.params.krId,
      });
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          code: 'INVALID_FIELD' as const,
          message: issue.message,
        }));
        res.status(400).json(responseBuilder.validationError(details));
        return;
      }

        const result = await handlers.updateKeyResultProgress.execute(
          req.params.id,
          req.params.krId,
          parsed.data.newValue,
          parsed.data.note,
        );
      respondWithResult(res, result);
    },
  );

  // DELETE /:id/key-results/:krId — 删除关键结果
  router.delete(
    '/:id/key-results/:krId',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await handlers.deleteKeyResult.execute(
          req.params.id,
          req.params.krId,
        );
      respondWithResult(res, result);
    },
  );

  // ==================== Review Routes ====================

  // POST /:id/reviews — 添加目标回顾
  router.post('/:id/reviews', auth, async (req: AuthenticatedRequest, res: Response) => {
    const parsed = CreateGoalReviewSchema.safeParse({
      ...req.body,
      goalId: req.params.id,
    });
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        code: 'INVALID_FIELD' as const,
        message: issue.message,
      }));
      res.status(400).json(responseBuilder.validationError(details));
      return;
    }

    const result = await handlers.addReview.execute(
        req.params.id,
        {
          title: parsed.data.title,
          content: parsed.data.content,
          reviewType: parsed.data.reviewType,
          rating: parsed.data.rating,
          achievements: parsed.data.achievements,
          challenges: parsed.data.challenges,
          nextActions: parsed.data.nextActions,
        },
      );
    respondWithResult(res, result, 201);
  });

  return router;
}
