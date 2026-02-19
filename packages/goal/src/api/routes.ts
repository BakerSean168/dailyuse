/**
 * Goal API Routes
 *
 * 路由定义与请求处理。
 * 中间件通过参数注入（来自 ApiBootstrapper 上下文），
 * 不直接依赖 apps/api 内部实现。
 *
 * Uses expressAdapter to eliminate boilerplate code:
 * - Zod validation is handled by the GoalController
 * - Error handling is unified via the adapter
 * - Context extraction is automatic
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
import type { RequestHandler } from 'express';
import { expressAdapter } from '@dailyuse/utils/result';
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
import { GoalController } from './controller';

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

// ============ Helpers ============

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
  const controller = new GoalController(handlers);

  // ==================== Goal CRUD ====================

  // POST / — 创建目标
  router.post('/', auth, expressAdapter(
    (req, ctx) => controller.create(req.body, ctx),
    { successStatus: 201 },
  ));

  // GET / — 查询目标列表
  router.get('/', auth, expressAdapter(
    (req, ctx) => controller.list({
      identityId: ctx.identityId,
      status: parseStringArray(req.query?.status),
      importance: parseStringArray(req.query?.importance),
      category: req.query?.category,
      tags: parseStringArray(req.query?.tags),
      folderId: req.query?.folderId,
      keyword: req.query?.keyword,
      startDate: parseNumber(req.query?.startDate),
      endDate: parseNumber(req.query?.endDate),
      sortBy: req.query?.sortBy,
      sortOrder: req.query?.sortOrder,
      page: parseNumber(req.query?.page),
      pageSize: parseNumber(req.query?.pageSize),
      includeKeyResults: parseBoolean(req.query?.includeKeyResults),
      includeReviews: parseBoolean(req.query?.includeReviews),
    }),
  ));

  // GET /search — 搜索目标
  router.get('/search', auth, expressAdapter(
    (req, ctx) => controller.search(
      ctx.identityId,
      typeof req.query?.q === 'string' ? req.query.q : '',
    ),
  ));

  // GET /:id — 获取目标详情
  router.get('/:id', auth, expressAdapter(
    (req) => controller.get(req.params!.id, parseBoolean(req.query?.includeChildren) ?? true),
    { requireAuth: false },
  ));

  // PUT /:id — 更新目标
  router.put('/:id', auth, expressAdapter(
    (req) => controller.update(req.params!.id, req.body),
  ));

  // PATCH /:id — 更新目标（别名）
  router.patch('/:id', auth, expressAdapter(
    (req) => controller.update(req.params!.id, req.body),
  ));

  // DELETE /:id — 删除目标（软删除）
  router.delete('/:id', auth, expressAdapter(
    (req) => controller.delete(req.params!.id),
  ));

  // ==================== Goal Status Operations ====================

  // POST /:id/archive — 归档目标
  router.post('/:id/archive', auth, expressAdapter(
    (req) => controller.archive(req.params!.id),
  ));

  // POST /:id/activate — 激活目标
  router.post('/:id/activate', auth, expressAdapter(
    (req) => controller.activate(req.params!.id),
  ));

  // ==================== Key Result Routes ====================

  // POST /:id/key-results — 添加关键结果
  router.post('/:id/key-results', auth, expressAdapter(
    (req) => controller.addKeyResult(req.params!.id, req.body),
    { successStatus: 201 },
  ));

  // PUT /:id/key-results/:krId — 更新关键结果
  router.put('/:id/key-results/:krId', auth, expressAdapter(
    (req) => controller.updateKeyResult(req.params!.id, req.params!.krId, req.body),
  ));

  // PATCH /:id/key-results/:krId/progress — 更新关键结果进度
  router.patch('/:id/key-results/:krId/progress', auth, expressAdapter(
    (req) => controller.updateKeyResultProgress(req.params!.id, req.params!.krId, req.body),
  ));

  // DELETE /:id/key-results/:krId — 删除关键结果
  router.delete('/:id/key-results/:krId', auth, expressAdapter(
    (req) => controller.deleteKeyResult(req.params!.id, req.params!.krId),
  ));

  // ==================== Review Routes ====================

  // POST /:id/reviews — 添加目标回顾
  router.post('/:id/reviews', auth, expressAdapter(
    (req) => controller.addReview(req.params!.id, req.body),
    { successStatus: 201 },
  ));

  return router;
}
