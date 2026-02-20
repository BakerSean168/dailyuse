/**
 * Governance CRUD Routes
 *
 * Uses expressAdapter to eliminate boilerplate code.
 * Governance handlers return Result<T> directly.
 *
 * Routes:
 *   POST   /              — 创建规则 (CreateRuleSchema)
 *   PUT    /:id           — 更新规则 (UpdateRuleSchema)
 *   PATCH  /:id           — 更新规则 (UpdateRuleSchema)
 *   DELETE /:id           — 删除规则 (DeleteRuleSchema)
 *   GET    /by-code/:code — 按代码获取规则
 *   GET    /:id           — 按 ID 获取规则
 *   GET    /              — 列表查询规则
 *   GET    /:id/revisions — 获取修订历史
 */

import { Router } from 'express';
import type { RequestHandler } from 'express';
import { expressAdapter } from '@dailyuse/utils/result';
import { GovernanceController } from '../controllers/governance.controller';
import type { GovernanceUseCases } from '../controllers/governance.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Helpers ============

function parseString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : undefined;
  }
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
}

function parseNumber(value: unknown): number | undefined {
  const raw = parseString(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length > 0 ? items : undefined;
  }
  if (typeof value === 'string') {
    const items = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length > 0 ? items : undefined;
  }
  return undefined;
}

// ============ Route Registration ============

export function registerGovernanceCrudRoutes(
  handlers: GovernanceUseCases,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth, requireRole } = middleware;
  const controller = new GovernanceController(handlers);

  // POST / — 创建规则
  router.post('/', auth, requireRole(['TechLead', 'Architect']), expressAdapter(
    (req, ctx) => controller.createRule(req.body, ctx),
    { successStatus: 201 },
  ));

  // PUT/PATCH /:id — 更新规则
  const updateHandler = expressAdapter(
    (req, ctx) => controller.updateRule(req.params!.id, req.body, ctx),
  );
  router.put('/:id', auth, requireRole(['TechLead', 'Architect']), updateHandler);
  router.patch('/:id', auth, requireRole(['TechLead', 'Architect']), updateHandler);

  // DELETE /:id — 删除规则
  router.delete('/:id', auth, requireRole(['TechLead', 'Architect']), expressAdapter(
    (req, ctx) => controller.deleteRule(req.params!.id, ctx),
  ));

  // GET /by-code/:code — 按代码获取规则
  router.get('/by-code/:code', auth, expressAdapter(
    (req) => controller.getRuleByCode(req.params!.code),
  ));

  // GET /:id/revisions — 获取修订历史 (must be before /:id)
  router.get('/:id/revisions', auth, expressAdapter(
    (req) => controller.getRevisions(req.params!.id, {
      page: parseNumber(req.query?.page),
      pageSize: parseNumber(req.query?.pageSize),
    }),
  ));

  // GET /:id — 按 ID 获取规则
  router.get('/:id', auth, expressAdapter(
    (req) => controller.getRuleById(req.params!.id),
  ));

  // GET / — 列表查询规则
  router.get('/', auth, expressAdapter(
    (req) => controller.listRules({
      status: parseString(req.query?.status),
      severity: parseString(req.query?.severity),
      tags: parseStringArray(req.query?.tags),
      page: parseNumber(req.query?.page),
      pageSize: parseNumber(req.query?.pageSize),
    }),
  ));

  return router;
}
