/**
 * OpenAPI Registry
 *
 * Centralized OpenAPI schema and path registration using @asteasolutions/zod-to-openapi.
 * Modules register their Zod schemas and API paths here for automatic documentation generation.
 *
 * @module openapi/registry
 */

import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// ============================================================================
// Singleton Registry
// ============================================================================

export const registry = new OpenAPIRegistry();

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Standard HTTP response envelope schema
 */
export const HttpResponseSchema = z.object({
  ok: z.boolean().describe('Whether the operation was successful'),
  code: z.number().describe('HTTP status code'),
  message: z.string().describe('Response message'),
  data: z.unknown().optional().describe('Response data (on success)'),
  error: z.object({
    code: z.string().describe('Error code'),
    message: z.string().describe('Error message'),
    details: z.array(z.object({
      field: z.string().optional().describe('Related field name'),
      code: z.string().describe('Detail error code'),
      message: z.string().describe('Detail error message'),
    })).optional().describe('Validation error details'),
  }).optional().describe('Error information (on failure)'),
  timestamp: z.number().describe('Response timestamp'),
  traceId: z.string().optional().describe('Request trace ID'),
  duration: z.number().optional().describe('Request duration in ms'),
});

registry.register('HttpResponse', HttpResponseSchema);

/**
 * Standard error response
 */
export const ErrorResponseSchema = z.object({
  ok: z.literal(false),
  code: z.number(),
  message: z.string(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({
      field: z.string().optional(),
      code: z.string(),
      message: z.string(),
    })).optional(),
  }),
  timestamp: z.number(),
});

registry.register('ErrorResponse', ErrorResponseSchema);

// ============================================================================
// Goal Module Schemas (Simplified for OpenAPI - avoid brandedId complexity)
// ============================================================================

const CreateGoalOpenApiSchema = z.object({
  title: z.string().min(1).max(256).describe('目标标题'),
  description: z.string().max(2000).optional().describe('目标描述'),
  color: z.string().optional().describe('颜色 (hex 格式, e.g. #FF5733)'),
  feasibilityAnalysis: z.string().max(2000).optional().describe('可行性分析'),
  motivation: z.string().max(2000).optional().describe('动机'),
  importance: z.enum(['low', 'medium', 'high', 'critical']).describe('重要程度'),
  category: z.string().max(100).optional().describe('分类'),
  tags: z.array(z.string().max(50)).optional().describe('标签列表'),
  startDate: z.number().int().optional().describe('开始日期 (timestamp)'),
  targetDate: z.number().int().optional().describe('目标日期 (timestamp)'),
  folderId: z.string().uuid().optional().describe('文件夹 ID'),
  parentGoalId: z.string().uuid().optional().describe('父目标 ID'),
});

const UpdateGoalOpenApiSchema = z.object({
  title: z.string().min(1).max(256).optional().describe('目标标题'),
  description: z.string().max(2000).nullable().optional().describe('目标描述'),
  color: z.string().nullable().optional().describe('颜色'),
  importance: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('重要程度'),
  category: z.string().max(100).nullable().optional().describe('分类'),
  tags: z.array(z.string().max(50)).nullable().optional().describe('标签列表'),
  startDate: z.number().int().nullable().optional().describe('开始日期'),
  targetDate: z.number().int().nullable().optional().describe('目标日期'),
});

const GoalOpenApiSchema = z.object({
  id: z.string().uuid().describe('目标 ID'),
  title: z.string().describe('目标标题'),
  description: z.string().nullable().optional().describe('目标描述'),
  status: z.string().describe('目标状态'),
  importance: z.string().describe('重要程度'),
  progress: z.number().describe('完成进度 (0-100)'),
  createdAt: z.number().describe('创建时间'),
  updatedAt: z.number().describe('更新时间'),
});

const AddKeyResultOpenApiSchema = z.object({
  title: z.string().min(1).max(256).describe('关键结果标题'),
  description: z.string().max(2000).optional().describe('描述'),
  valueType: z.string().describe('值类型'),
  calculationMethod: z.string().describe('计算方法'),
  targetValue: z.number().min(0).describe('目标值'),
  currentValue: z.number().optional().describe('当前值'),
  unit: z.string().max(50).optional().describe('单位'),
  weight: z.number().min(0).max(1).describe('权重 (0-1)'),
});

const CreateGoalReviewOpenApiSchema = z.object({
  title: z.string().min(1).describe('回顾标题'),
  content: z.string().describe('回顾内容'),
  reviewType: z.string().describe('回顾类型'),
  rating: z.number().optional().describe('评分'),
  achievements: z.array(z.string()).optional().describe('成就列表'),
  challenges: z.array(z.string()).optional().describe('挑战列表'),
  nextActions: z.array(z.string()).optional().describe('下一步行动'),
});

// Register schemas
registry.register('CreateGoal', CreateGoalOpenApiSchema);
registry.register('UpdateGoal', UpdateGoalOpenApiSchema);
registry.register('Goal', GoalOpenApiSchema);
registry.register('AddKeyResult', AddKeyResultOpenApiSchema);
registry.register('CreateGoalReview', CreateGoalReviewOpenApiSchema);

// ============================================================================
// Goal API Paths
// ============================================================================

function successResponse(schema: z.ZodType, description: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: z.object({
          ok: z.literal(true),
          code: z.number(),
          message: z.string(),
          data: schema,
          timestamp: z.number(),
        }),
      },
    },
  };
}

function errorResponse(description: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
      },
    },
  };
}

// POST /goals
registry.registerPath({
  method: 'post',
  path: '/api/v1/goals',
  summary: '创建目标',
  tags: ['Goals'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateGoalOpenApiSchema,
        },
      },
    },
  },
  responses: {
    201: successResponse(GoalOpenApiSchema, '创建成功'),
    400: errorResponse('参数验证失败'),
    401: errorResponse('未授权'),
  },
});

// GET /goals
registry.registerPath({
  method: 'get',
  path: '/api/v1/goals',
  summary: '查询目标列表',
  tags: ['Goals'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      status: z.string().optional().describe('状态过滤 (逗号分隔)'),
      importance: z.string().optional().describe('重要程度过滤'),
      category: z.string().optional().describe('分类过滤'),
      keyword: z.string().optional().describe('关键字搜索'),
      page: z.string().optional().describe('页码 (默认: 1)'),
      pageSize: z.string().optional().describe('每页数量 (默认: 20)'),
      sortBy: z.enum(['createdAt', 'updatedAt', 'targetDate', 'priority']).optional().describe('排序字段'),
      sortOrder: z.enum(['asc', 'desc']).optional().describe('排序方向'),
    }),
  },
  responses: {
    200: successResponse(z.array(GoalOpenApiSchema), '查询成功'),
    401: errorResponse('未授权'),
  },
});

// GET /goals/search
registry.registerPath({
  method: 'get',
  path: '/api/v1/goals/search',
  summary: '搜索目标',
  tags: ['Goals'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      q: z.string().describe('搜索关键字'),
    }),
  },
  responses: {
    200: successResponse(z.array(GoalOpenApiSchema), '搜索成功'),
    400: errorResponse('缺少搜索关键字'),
    401: errorResponse('未授权'),
  },
});

// GET /goals/:id
registry.registerPath({
  method: 'get',
  path: '/api/v1/goals/{id}',
  summary: '获取目标详情',
  tags: ['Goals'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('目标 ID'),
    }),
    query: z.object({
      includeChildren: z.string().optional().describe('是否包含子目标 (默认: true)'),
    }),
  },
  responses: {
    200: successResponse(GoalOpenApiSchema, '获取成功'),
    404: errorResponse('目标不存在'),
  },
});

// PUT /goals/:id
registry.registerPath({
  method: 'put',
  path: '/api/v1/goals/{id}',
  summary: '更新目标',
  tags: ['Goals'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('目标 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateGoalOpenApiSchema,
        },
      },
    },
  },
  responses: {
    200: successResponse(GoalOpenApiSchema, '更新成功'),
    400: errorResponse('参数验证失败'),
    404: errorResponse('目标不存在'),
  },
});

// DELETE /goals/:id
registry.registerPath({
  method: 'delete',
  path: '/api/v1/goals/{id}',
  summary: '删除目标（软删除）',
  tags: ['Goals'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('目标 ID'),
    }),
  },
  responses: {
    200: successResponse(GoalOpenApiSchema, '删除成功'),
    404: errorResponse('目标不存在'),
  },
});

// POST /goals/:id/archive
registry.registerPath({
  method: 'post',
  path: '/api/v1/goals/{id}/archive',
  summary: '归档目标',
  tags: ['Goals'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('目标 ID'),
    }),
  },
  responses: {
    200: successResponse(GoalOpenApiSchema, '归档成功'),
    404: errorResponse('目标不存在'),
  },
});

// POST /goals/:id/activate
registry.registerPath({
  method: 'post',
  path: '/api/v1/goals/{id}/activate',
  summary: '激活目标',
  tags: ['Goals'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('目标 ID'),
    }),
  },
  responses: {
    200: successResponse(GoalOpenApiSchema, '激活成功'),
    404: errorResponse('目标不存在'),
  },
});

// POST /goals/:id/key-results
registry.registerPath({
  method: 'post',
  path: '/api/v1/goals/{id}/key-results',
  summary: '添加关键结果',
  tags: ['Goals - Key Results'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('目标 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: AddKeyResultOpenApiSchema,
        },
      },
    },
  },
  responses: {
    201: successResponse(z.object({ id: z.string() }), '添加成功'),
    400: errorResponse('参数验证失败'),
  },
});

// POST /goals/:id/reviews
registry.registerPath({
  method: 'post',
  path: '/api/v1/goals/{id}/reviews',
  summary: '添加目标回顾',
  tags: ['Goals - Reviews'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('目标 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: CreateGoalReviewOpenApiSchema,
        },
      },
    },
  },
  responses: {
    201: successResponse(z.object({ id: z.string() }), '添加成功'),
    400: errorResponse('参数验证失败'),
  },
});

// ============================================================================
// Authentication API Paths
// ============================================================================

const LoginSchema = z.object({
  email: z.string().email().describe('邮箱地址'),
  password: z.string().min(6).describe('密码'),
});

const RegisterSchema = z.object({
  email: z.string().email().describe('邮箱地址'),
  password: z.string().min(6).describe('密码'),
  displayName: z.string().optional().describe('显示名称'),
});

const AuthTokensSchema = z.object({
  accessToken: z.string().describe('访问令牌'),
  refreshToken: z.string().describe('刷新令牌'),
  identityId: z.string().describe('用户身份 ID'),
});

registry.register('LoginRequest', LoginSchema);
registry.register('RegisterRequest', RegisterSchema);
registry.register('AuthTokens', AuthTokensSchema);

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  summary: '用户注册',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterSchema,
        },
      },
    },
  },
  responses: {
    201: successResponse(AuthTokensSchema, '注册成功'),
    400: errorResponse('参数验证失败'),
    409: errorResponse('邮箱已注册'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  summary: '用户登录',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginSchema,
        },
      },
    },
  },
  responses: {
    200: successResponse(AuthTokensSchema, '登录成功'),
    401: errorResponse('凭证无效'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  summary: '用户登出',
  tags: ['Authentication'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.null(), '登出成功'),
    401: errorResponse('未授权'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/refresh',
  summary: '刷新访问令牌',
  tags: ['Authentication'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            refreshToken: z.string().describe('刷新令牌'),
          }),
        },
      },
    },
  },
  responses: {
    200: successResponse(AuthTokensSchema, '刷新成功'),
    401: errorResponse('令牌无效或已过期'),
  },
});
