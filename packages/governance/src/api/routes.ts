/**
 * Governance CRUD Routes
 *
 * 路由定义与请求处理。
 * 中间件通过参数注入（来自 ApiBootstrapper 上下文），
 * 不直接依赖 apps/api 内部实现。
 */

import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import {
  type CreateRuleReq,
  type CreateRuleRes,
  type DeleteRuleReq,
  type DeleteRuleRes,
  type GetRuleReq,
  type GetRuleRes,
  type GetRuleRevisionsQuery,
  type GetRuleRevisionsRes,
  type ListRulesQuery,
  type ListRulesRes,
  type UpdateRuleReq,
  type UpdateRuleRes,
  GetRuleSchema,
  DeleteRuleSchema,
  ListRulesQuerySchema,
  GetRuleRevisionsQuerySchema,
  CreateRuleSchema,
  UpdateRuleSchema,
} from '../contracts';
import { createExpressHelper, isOk, type Result } from '@dailyuse/utils/result';
import type { ExecutionContext } from '../application-server';

// ============ Types ============

export interface GovernanceCrudHandlers {
  createRule: (req: CreateRuleReq, cx: ExecutionContext) => Promise<Result<CreateRuleRes>>;
  updateRule: (id: string, req: UpdateRuleReq, cx: ExecutionContext) => Promise<Result<UpdateRuleRes>>;
  deleteRule: (req: DeleteRuleReq, cx: ExecutionContext) => Promise<Result<DeleteRuleRes>>;
  getRule: (req: GetRuleReq) => Promise<Result<GetRuleRes>>;
  listRules: (query: ListRulesQuery) => Promise<Result<ListRulesRes>>;
  getRevisions: (query: GetRuleRevisionsQuery) => Promise<Result<GetRuleRevisionsRes>>;
}

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

interface AuthenticatedRequest extends Request {
  id?: string;
  traceId?: string;
  startTime?: number;
  user?: {
    accountUuid: string;
    sessionUuid?: string;
    tokenType?: string;
    exp?: number;
  };
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

function getExecutionContext(req: AuthenticatedRequest): ExecutionContext | null {
  if (!req.user?.accountUuid) {
    return null;
  }
  return { identityId: req.user.accountUuid } as ExecutionContext;
}

// ============ Route Registration ============

export function registerGovernanceCrudRoutes(
  handlers: GovernanceCrudHandlers,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth, requireRole } = middleware;

  // POST / — 创建规则
  router.post(
    '/',
    auth,
    requireRole(['TechLead', 'Architect']),
    async (req: AuthenticatedRequest, res: Response) => {
      const helper = createExpressHelper(res, req);
      const parsed = CreateRuleSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }

      const cx = getExecutionContext(req);
      if (!cx) {
        return helper.unauthorized();
      }

      const result = await handlers.createRule(parsed.data, cx);
      if (isOk(result)) {
        return helper.created(result.data, '规则创建成功');
      }
      return helper.send(result);
    },
  );

  // PUT/PATCH /:id — 更新规则
  const updateHandler = async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    const parsed = UpdateRuleSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
    }

    const cx = getExecutionContext(req);
    if (!cx) {
      return helper.unauthorized();
    }

    const result = await handlers.updateRule(req.params.id, parsed.data, cx);
    return helper.send(result);
  };

  router.put('/:id', auth, requireRole(['TechLead', 'Architect']), updateHandler);
  router.patch('/:id', auth, requireRole(['TechLead', 'Architect']), updateHandler);

  // DELETE /:id — 删除规则
  router.delete(
    '/:id',
    auth,
    requireRole(['TechLead', 'Architect']),
    async (req: AuthenticatedRequest, res: Response) => {
      const helper = createExpressHelper(res, req);
      const parsed = DeleteRuleSchema.safeParse({ id: req.params.id });
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }

      const cx = getExecutionContext(req);
      if (!cx) {
        return helper.unauthorized();
      }

      const result = await handlers.deleteRule(parsed.data, cx);
      return helper.send(result);
    },
  );

  // GET /by-code/:code — 按代码获取规则
  router.get(
    '/by-code/:code',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const helper = createExpressHelper(res, req);
      const parsed = GetRuleSchema.safeParse({ code: req.params.code });
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.getRule(parsed.data);
      return helper.send(result);
    },
  );

  // GET /:id — 按 ID 获取规则
  router.get('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    const parsed = GetRuleSchema.safeParse({ id: req.params.id });
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
    }

    const result = await handlers.getRule(parsed.data);
    return helper.send(result);
  });

  // GET / — 列表查询规则
  router.get('/', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    const parsed = ListRulesQuerySchema.safeParse({
      status: parseString(req.query.status),
      severity: parseString(req.query.severity),
      tags: parseStringArray(req.query.tags),
      page: parseNumber(req.query.page),
      pageSize: parseNumber(req.query.pageSize),
    });

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
    }

    const result = await handlers.listRules(parsed.data);
    return helper.send(result);
  });

  // GET /:id/revisions — 获取修订历史
  router.get(
    '/:id/revisions',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const helper = createExpressHelper(res, req);
      const parsed = GetRuleRevisionsQuerySchema.safeParse({
        ruleId: req.params.id,
        page: parseNumber(req.query.page),
        pageSize: parseNumber(req.query.pageSize),
      });

      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.getRevisions(parsed.data);
      return helper.send(result);
    },
  );

  return router;
}
