/**
 * Route Registrar
 *
 * 统一的路由注册器，同时完成 Express 路由绑定和 OpenAPI 文档注册。
 * 消除"双重记账"问题 —— 路由路径、方法、参数只需要写在一个地方。
 *
 * @module @memoflow/utils/result/route-registrar
 *
 * @example
 * ```ts
 * import { RouteRegistrar, successResponse, errorResponse } from '@memoflow/utils/result';
 *
 * const registrar = new RouteRegistrar(router, openApiRegistry, {
 *   basePath: '/api/v1/goals',
 *   defaultTags: ['Goal'],
 *   defaultSecurity: [{ bearerAuth: [] }],
 * });
 *
 * registrar.route(
 *   {
 *     method: 'post',
 *     path: '/',
 *     summary: '创建目标',
 *     request: { body: { content: { 'application/json': { schema: CreateGoalSchema } } } },
 *     responses: { 201: successResponse(GoalResponseSchema, '创建成功') },
 *   },
 *   [auth],
 *   (req, ctx) => controller.create(req.body, ctx),
 *   { successStatus: 201 },
 * );
 * ```
 */

import type { Result } from '@memoflow/contracts/result';
import type { ExecutionContext, RequestContext } from '@memoflow/contracts/shared';
import { expressAdapter, type ExpressAdapterOptions } from './express-adapter';

// ============================================================================
// Minimal Interfaces (avoid hard dependencies on Express / zod-to-openapi)
// ============================================================================

/** Minimal Express Router interface */
interface RouterLike {
  get(path: string, ...handlers: unknown[]): unknown;
  post(path: string, ...handlers: unknown[]): unknown;
  put(path: string, ...handlers: unknown[]): unknown;
  patch(path: string, ...handlers: unknown[]): unknown;
  delete(path: string, ...handlers: unknown[]): unknown;
}

/** Minimal OpenAPI Registry interface (compatible with @asteasolutions/zod-to-openapi) */
export interface OpenApiRegistryLike {
  registerPath(route: Record<string, unknown>): void;
  register(name: string, schema: unknown): void;
}

/** Supported HTTP methods */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/** Express-like request (mirrors the one from express-adapter) */
interface ExpressLikeRequest {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
  user?: { identityId?: string; sessionId?: string; tokenType?: string; exp?: number };
  /**
   * Producer-owned canonical request metadata set by the RequestContext
   * middleware. Required — the adapter fails closed without it.
   * 由 RequestContext middleware 写入的 producer-owned 请求元数据；缺失时
   * adapter 直接 fail closed。
   */
  requestContext?: RequestContext;
  id?: string;
  traceId?: string;
  startTime?: number;
}

// ============================================================================
// Route Definition
// ============================================================================

/**
 * Unified route definition used for both Express routing and OpenAPI documentation.
 */
export interface ApiRouteDefinition {
  /** HTTP method */
  method: HttpMethod;
  /** Express-style path (e.g., '/', '/:id', '/:id/key-results') */
  path: string;
  /** OpenAPI tags (overrides registrar defaults) */
  tags?: string[];
  /** OpenAPI summary */
  summary?: string;
  /** OpenAPI description */
  description?: string;
  /** OpenAPI security (overrides registrar defaults) */
  security?: Record<string, string[]>[];
  /** OpenAPI request definition (params, query, body) */
  request?: Record<string, unknown>;
  /** OpenAPI response definitions */
  responses?: Record<number, unknown>;
  /** Skip OpenAPI registration for this route (e.g., for PATCH alias routes) */
  skipOpenApi?: boolean;
}

// ============================================================================
// Registrar Configuration
// ============================================================================

export interface RouteRegistrarConfig {
  /** Base path for OpenAPI (e.g., '/api/v1/goals') */
  basePath: string;
  /** Default tags applied to all routes */
  defaultTags?: string[];
  /** Default security applied to all routes */
  defaultSecurity?: Record<string, string[]>[];
}

// ============================================================================
// RouteRegistrar
// ============================================================================

/**
 * Unified route registrar that combines Express routing with OpenAPI documentation.
 *
 * Eliminates the "double bookkeeping" problem by registering both Express routes
 * and OpenAPI path definitions in a single `route()` call.
 *
 * When no OpenAPI registry is provided (e.g., in tests or IPC mode),
 * only Express routes are registered — the behavior degrades gracefully.
 */
export class RouteRegistrar {
  constructor(
    private readonly router: RouterLike,
    private readonly registry: OpenApiRegistryLike | null,
    private readonly config: RouteRegistrarConfig,
  ) {}

  /**
   * Register a named schema in the OpenAPI components section.
   */
  registerSchema(name: string, schema: unknown): this {
    this.registry?.register(name, schema);
    return this;
  }

  /**
   * Register an API route — simultaneously binds Express handler and OpenAPI path.
   *
   * @param def - Route definition (method, path, OpenAPI metadata)
   * @param middleware - Express middleware array (e.g., [auth])
   * @param handler - Controller handler function (receives req and context)
   * @param adapterOptions - Options for expressAdapter (e.g., \{ successStatus: 201 \})
   * @returns this (for chaining)
   */
  route<T>(
    def: ApiRouteDefinition,
    middleware: unknown[],
    handler: (req: ExpressLikeRequest, context: ExecutionContext) => Promise<Result<T>>,
    adapterOptions?: ExpressAdapterOptions,
  ): this {
    // 1. Register OpenAPI path (if registry provided and not skipped)
    if (this.registry && !def.skipOpenApi) {
      const openApiPath = this.toOpenApiPath(def.path);
      const fullPath =
        openApiPath === '/' ? this.config.basePath : `${this.config.basePath}${openApiPath}`;

      this.registry.registerPath({
        method: def.method,
        path: fullPath,
        tags: def.tags ?? this.config.defaultTags,
        summary: def.summary,
        description: def.description,
        security: def.security ?? this.config.defaultSecurity,
        request: def.request,
        responses: def.responses ?? {},
      });
    }

    // 2. Bind Express route
    const adapted = expressAdapter(handler, adapterOptions);
    this.router[def.method](def.path, ...middleware, adapted);

    return this;
  }

  /**
   * Get the underlying router instance.
   */
  getRouter(): RouterLike {
    return this.router;
  }

  // ─── Private ───

  /**
   * Convert Express path params to OpenAPI path params.
   * e.g., '/:id/key-results/:krId' → '/{id}/key-results/{krId}'
   */
  private toOpenApiPath(expressPath: string): string {
    return expressPath.replace(/:(\w+)/g, '{$1}');
  }
}
