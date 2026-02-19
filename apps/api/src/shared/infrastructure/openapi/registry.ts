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
// Task Module Schemas (Simplified for OpenAPI - avoid brandedId complexity)
// ============================================================================

const CreateTaskTemplateOpenApiSchema = z.object({
  name: z.string().min(1).describe('任务模板名称'),
  description: z.string().optional().nullable().describe('模板描述'),
  taskType: z.enum(['ONE_TIME', 'RECURRING']).describe('任务类型'),
  timeConfig: z.object({}).passthrough().describe('时间配置'),
  recurrenceRule: z.object({}).passthrough().optional().nullable().describe('重复规则'),
  reminderConfig: z.object({}).passthrough().optional().nullable().describe('提醒配置'),
  importance: z.string().describe('重要程度'),
  folderId: z.string().uuid().optional().nullable().describe('文件夹 ID'),
  tags: z.array(z.string()).optional().describe('标签列表'),
  color: z.string().optional().nullable().describe('颜色'),
});

const UpdateTaskTemplateOpenApiSchema = z.object({
  name: z.string().min(1).optional().describe('任务模板名称'),
  description: z.string().optional().nullable().describe('模板描述'),
  recurrenceRule: z.object({}).passthrough().optional().nullable().describe('重复规则'),
  importance: z.string().optional().describe('重要程度'),
  folderId: z.string().uuid().optional().nullable().describe('文件夹 ID'),
  tags: z.array(z.string()).optional().describe('标签列表'),
  color: z.string().optional().nullable().describe('颜色'),
});

const TaskTemplateOpenApiSchema = z.object({
  id: z.string().uuid().describe('任务模板 ID'),
  name: z.string().describe('模板名称'),
  description: z.string().nullable().optional().describe('模板描述'),
  taskType: z.string().describe('任务类型'),
  status: z.string().describe('模板状态'),
  importance: z.string().describe('重要程度'),
  createdAt: z.number().describe('创建时间'),
  updatedAt: z.number().describe('更新时间'),
});

const TaskInstanceOpenApiSchema = z.object({
  id: z.string().uuid().describe('任务实例 ID'),
  templateId: z.string().uuid().describe('所属模板 ID'),
  status: z.string().describe('实例状态'),
  scheduledDate: z.number().describe('计划日期'),
  completedAt: z.number().optional().nullable().describe('完成时间'),
  createdAt: z.number().describe('创建时间'),
  updatedAt: z.number().describe('更新时间'),
});

const CompleteTaskInstanceOpenApiSchema = z.object({
  duration: z.number().optional().describe('持续时间 (分钟)'),
  note: z.string().optional().describe('完成备注'),
  rating: z.number().int().min(1).max(5).optional().describe('评分 (1-5)'),
});

const SkipTaskInstanceOpenApiSchema = z.object({
  reason: z.string().optional().describe('跳过原因'),
});

// Register Task schemas
registry.register('CreateTaskTemplate', CreateTaskTemplateOpenApiSchema);
registry.register('UpdateTaskTemplate', UpdateTaskTemplateOpenApiSchema);
registry.register('TaskTemplate', TaskTemplateOpenApiSchema);
registry.register('TaskInstance', TaskInstanceOpenApiSchema);
registry.register('CompleteTaskInstance', CompleteTaskInstanceOpenApiSchema);
registry.register('SkipTaskInstance', SkipTaskInstanceOpenApiSchema);

// ============================================================================
// Task Template API Paths
// ============================================================================

// POST /task-templates
registry.registerPath({
  method: 'post',
  path: '/api/v1/task-templates',
  summary: '创建任务模板',
  tags: ['Task Templates'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateTaskTemplateOpenApiSchema,
        },
      },
    },
  },
  responses: {
    201: successResponse(TaskTemplateOpenApiSchema, '创建成功'),
    400: errorResponse('参数验证失败'),
    401: errorResponse('未授权'),
  },
});

// GET /task-templates
registry.registerPath({
  method: 'get',
  path: '/api/v1/task-templates',
  summary: '查询任务模板列表',
  tags: ['Task Templates'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      status: z.string().optional().describe('状态过滤'),
      folderId: z.string().optional().describe('文件夹 ID 过滤'),
      goalId: z.string().optional().describe('关联目标 ID 过滤'),
      tags: z.string().optional().describe('标签过滤 (逗号分隔)'),
    }),
  },
  responses: {
    200: successResponse(z.array(TaskTemplateOpenApiSchema), '查询成功'),
    401: errorResponse('未授权'),
  },
});

// GET /task-templates/:id
registry.registerPath({
  method: 'get',
  path: '/api/v1/task-templates/{id}',
  summary: '获取任务模板详情',
  tags: ['Task Templates'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('模板 ID'),
    }),
    query: z.object({
      includeChildren: z.string().optional().describe('是否包含子项 (默认: false)'),
    }),
  },
  responses: {
    200: successResponse(TaskTemplateOpenApiSchema, '获取成功'),
    404: errorResponse('模板不存在'),
  },
});

// PUT /task-templates/:id
registry.registerPath({
  method: 'put',
  path: '/api/v1/task-templates/{id}',
  summary: '更新任务模板',
  tags: ['Task Templates'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('模板 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateTaskTemplateOpenApiSchema,
        },
      },
    },
  },
  responses: {
    200: successResponse(TaskTemplateOpenApiSchema, '更新成功'),
    400: errorResponse('参数验证失败'),
    404: errorResponse('模板不存在'),
  },
});

// DELETE /task-templates/:id
registry.registerPath({
  method: 'delete',
  path: '/api/v1/task-templates/{id}',
  summary: '删除任务模板',
  tags: ['Task Templates'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('模板 ID'),
    }),
  },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('模板不存在'),
  },
});

// POST /task-templates/:id/activate
registry.registerPath({
  method: 'post',
  path: '/api/v1/task-templates/{id}/activate',
  summary: '激活任务模板',
  tags: ['Task Templates'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('模板 ID'),
    }),
  },
  responses: {
    200: successResponse(TaskTemplateOpenApiSchema, '激活成功'),
    404: errorResponse('模板不存在'),
  },
});

// POST /task-templates/:id/pause
registry.registerPath({
  method: 'post',
  path: '/api/v1/task-templates/{id}/pause',
  summary: '暂停任务模板',
  tags: ['Task Templates'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('模板 ID'),
    }),
  },
  responses: {
    200: successResponse(TaskTemplateOpenApiSchema, '暂停成功'),
    404: errorResponse('模板不存在'),
  },
});

// POST /task-templates/:id/archive
registry.registerPath({
  method: 'post',
  path: '/api/v1/task-templates/{id}/archive',
  summary: '归档任务模板',
  tags: ['Task Templates'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('模板 ID'),
    }),
  },
  responses: {
    200: successResponse(TaskTemplateOpenApiSchema, '归档成功'),
    404: errorResponse('模板不存在'),
  },
});

// ============================================================================
// Task Instance API Paths
// ============================================================================

// GET /task-instances
registry.registerPath({
  method: 'get',
  path: '/api/v1/task-instances',
  summary: '查询任务实例列表',
  tags: ['Task Instances'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      templateId: z.string().optional().describe('模板 ID 过滤'),
      status: z.string().optional().describe('状态过滤'),
    }),
  },
  responses: {
    200: successResponse(z.array(TaskInstanceOpenApiSchema), '查询成功'),
    401: errorResponse('未授权'),
  },
});

// GET /task-instances/by-date-range
registry.registerPath({
  method: 'get',
  path: '/api/v1/task-instances/by-date-range',
  summary: '按日期范围查询任务实例',
  tags: ['Task Instances'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      startDate: z.string().optional().describe('开始日期 (timestamp)'),
      endDate: z.string().optional().describe('结束日期 (timestamp)'),
    }),
  },
  responses: {
    200: successResponse(z.array(TaskInstanceOpenApiSchema), '查询成功'),
    401: errorResponse('未授权'),
  },
});

// GET /task-instances/:id
registry.registerPath({
  method: 'get',
  path: '/api/v1/task-instances/{id}',
  summary: '获取任务实例详情',
  tags: ['Task Instances'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('实例 ID'),
    }),
  },
  responses: {
    200: successResponse(TaskInstanceOpenApiSchema, '获取成功'),
    404: errorResponse('实例不存在'),
  },
});

// POST /task-instances/:id/complete
registry.registerPath({
  method: 'post',
  path: '/api/v1/task-instances/{id}/complete',
  summary: '完成任务实例',
  tags: ['Task Instances'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('实例 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: CompleteTaskInstanceOpenApiSchema,
        },
      },
    },
  },
  responses: {
    200: successResponse(TaskInstanceOpenApiSchema, '完成成功'),
    404: errorResponse('实例不存在'),
  },
});

// POST /task-instances/:id/skip
registry.registerPath({
  method: 'post',
  path: '/api/v1/task-instances/{id}/skip',
  summary: '跳过任务实例',
  tags: ['Task Instances'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('实例 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: SkipTaskInstanceOpenApiSchema,
        },
      },
    },
  },
  responses: {
    200: successResponse(TaskInstanceOpenApiSchema, '跳过成功'),
    404: errorResponse('实例不存在'),
  },
});

// POST /task-instances/:id/start
registry.registerPath({
  method: 'post',
  path: '/api/v1/task-instances/{id}/start',
  summary: '开始任务实例',
  tags: ['Task Instances'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('实例 ID'),
    }),
  },
  responses: {
    200: successResponse(TaskInstanceOpenApiSchema, '开始成功'),
    404: errorResponse('实例不存在'),
  },
});

// DELETE /task-instances/:id
registry.registerPath({
  method: 'delete',
  path: '/api/v1/task-instances/{id}',
  summary: '删除任务实例',
  tags: ['Task Instances'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('实例 ID'),
    }),
  },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('实例不存在'),
  },
});

// ============================================================================
// Reminder Module Schemas
// ============================================================================

const ReminderTemplateOpenApiSchema = z.object({
  id: z.string().uuid().describe('提醒模板 ID'),
  name: z.string().describe('模板名称'),
  description: z.string().nullable().optional().describe('模板描述'),
  triggerType: z.string().describe('触发类型'),
  status: z.string().describe('模板状态'),
  createdAt: z.number().describe('创建时间'),
  updatedAt: z.number().describe('更新时间'),
});

const CreateReminderTemplateOpenApiSchema = z.object({
  name: z.string().min(1).describe('模板名称'),
  description: z.string().optional().nullable().describe('模板描述'),
  triggerType: z.string().describe('触发类型'),
  triggerConfig: z.object({}).passthrough().describe('触发配置'),
  notificationConfig: z.object({}).passthrough().optional().describe('通知配置'),
  recurrenceRule: z.object({}).passthrough().optional().nullable().describe('重复规则'),
});

const UpdateReminderTemplateOpenApiSchema = z.object({
  name: z.string().min(1).optional().describe('模板名称'),
  description: z.string().optional().nullable().describe('模板描述'),
  triggerConfig: z.object({}).passthrough().optional().describe('触发配置'),
  notificationConfig: z.object({}).passthrough().optional().describe('通知配置'),
  recurrenceRule: z.object({}).passthrough().optional().nullable().describe('重复规则'),
});

const ReminderGroupOpenApiSchema = z.object({
  id: z.string().uuid().describe('提醒组 ID'),
  name: z.string().describe('组名称'),
  description: z.string().nullable().optional().describe('组描述'),
  controlMode: z.string().describe('控制模式'),
  createdAt: z.number().describe('创建时间'),
  updatedAt: z.number().describe('更新时间'),
});

const CreateReminderGroupOpenApiSchema = z.object({
  name: z.string().min(1).describe('组名称'),
  description: z.string().optional().nullable().describe('组描述'),
  controlMode: z.string().optional().describe('控制模式'),
});

const UpdateReminderGroupOpenApiSchema = z.object({
  name: z.string().min(1).optional().describe('组名称'),
  description: z.string().optional().nullable().describe('组描述'),
});

registry.register('ReminderTemplate', ReminderTemplateOpenApiSchema);
registry.register('CreateReminderTemplate', CreateReminderTemplateOpenApiSchema);
registry.register('UpdateReminderTemplate', UpdateReminderTemplateOpenApiSchema);
registry.register('ReminderGroup', ReminderGroupOpenApiSchema);
registry.register('CreateReminderGroup', CreateReminderGroupOpenApiSchema);
registry.register('UpdateReminderGroup', UpdateReminderGroupOpenApiSchema);

// ============================================================================
// Reminder Template API Paths
// ============================================================================

// POST /reminders/templates
registry.registerPath({
  method: 'post',
  path: '/api/v1/reminders/templates',
  summary: '创建提醒模板',
  tags: ['Reminder Templates'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateReminderTemplateOpenApiSchema,
        },
      },
    },
  },
  responses: {
    201: successResponse(ReminderTemplateOpenApiSchema, '创建成功'),
    400: errorResponse('参数验证失败'),
    401: errorResponse('未授权'),
  },
});

// GET /reminders/templates
registry.registerPath({
  method: 'get',
  path: '/api/v1/reminders/templates',
  summary: '查询提醒模板列表',
  tags: ['Reminder Templates'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.array(ReminderTemplateOpenApiSchema), '查询成功'),
    401: errorResponse('未授权'),
  },
});

// GET /reminders/templates/upcoming
registry.registerPath({
  method: 'get',
  path: '/api/v1/reminders/templates/upcoming',
  summary: '获取即将触发的提醒',
  tags: ['Reminder Templates'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      limit: z.string().optional().describe('返回数量限制'),
      beforeTime: z.string().optional().describe('截止时间'),
    }),
  },
  responses: {
    200: successResponse(z.array(ReminderTemplateOpenApiSchema), '查询成功'),
    401: errorResponse('未授权'),
  },
});

// GET /reminders/templates/:id
registry.registerPath({
  method: 'get',
  path: '/api/v1/reminders/templates/{id}',
  summary: '获取提醒模板详情',
  tags: ['Reminder Templates'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('模板 ID'),
    }),
  },
  responses: {
    200: successResponse(ReminderTemplateOpenApiSchema, '获取成功'),
    404: errorResponse('模板不存在'),
  },
});

// PUT /reminders/templates/:id
registry.registerPath({
  method: 'put',
  path: '/api/v1/reminders/templates/{id}',
  summary: '更新提醒模板',
  tags: ['Reminder Templates'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('模板 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateReminderTemplateOpenApiSchema,
        },
      },
    },
  },
  responses: {
    200: successResponse(ReminderTemplateOpenApiSchema, '更新成功'),
    400: errorResponse('参数验证失败'),
    404: errorResponse('模板不存在'),
  },
});

// DELETE /reminders/templates/:id
registry.registerPath({
  method: 'delete',
  path: '/api/v1/reminders/templates/{id}',
  summary: '删除提醒模板',
  tags: ['Reminder Templates'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('模板 ID'),
    }),
  },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('模板不存在'),
  },
});

// ============================================================================
// Reminder Group API Paths
// ============================================================================

// POST /reminders/groups
registry.registerPath({
  method: 'post',
  path: '/api/v1/reminders/groups',
  summary: '创建提醒组',
  tags: ['Reminder Groups'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateReminderGroupOpenApiSchema,
        },
      },
    },
  },
  responses: {
    201: successResponse(ReminderGroupOpenApiSchema, '创建成功'),
    400: errorResponse('参数验证失败'),
    401: errorResponse('未授权'),
  },
});

// GET /reminders/groups
registry.registerPath({
  method: 'get',
  path: '/api/v1/reminders/groups',
  summary: '查询提醒组列表',
  tags: ['Reminder Groups'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.array(ReminderGroupOpenApiSchema), '查询成功'),
    401: errorResponse('未授权'),
  },
});

// GET /reminders/groups/:id
registry.registerPath({
  method: 'get',
  path: '/api/v1/reminders/groups/{id}',
  summary: '获取提醒组详情',
  tags: ['Reminder Groups'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('提醒组 ID'),
    }),
  },
  responses: {
    200: successResponse(ReminderGroupOpenApiSchema, '获取成功'),
    404: errorResponse('提醒组不存在'),
  },
});

// PUT /reminders/groups/:id
registry.registerPath({
  method: 'put',
  path: '/api/v1/reminders/groups/{id}',
  summary: '更新提醒组',
  tags: ['Reminder Groups'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('提醒组 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateReminderGroupOpenApiSchema,
        },
      },
    },
  },
  responses: {
    200: successResponse(ReminderGroupOpenApiSchema, '更新成功'),
    400: errorResponse('参数验证失败'),
    404: errorResponse('提醒组不存在'),
  },
});

// DELETE /reminders/groups/:id
registry.registerPath({
  method: 'delete',
  path: '/api/v1/reminders/groups/{id}',
  summary: '删除提醒组',
  tags: ['Reminder Groups'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('提醒组 ID'),
    }),
  },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('提醒组不存在'),
  },
});

// POST /reminders/groups/:id/control-mode
registry.registerPath({
  method: 'post',
  path: '/api/v1/reminders/groups/{id}/control-mode',
  summary: '切换提醒组控制模式',
  tags: ['Reminder Groups'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('提醒组 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            controlMode: z.string().describe('控制模式'),
          }),
        },
      },
    },
  },
  responses: {
    200: successResponse(ReminderGroupOpenApiSchema, '切换成功'),
    400: errorResponse('参数验证失败'),
  },
});

// POST /reminders/groups/:id/batch
registry.registerPath({
  method: 'post',
  path: '/api/v1/reminders/groups/{id}/batch',
  summary: '批量操作提醒组模板',
  tags: ['Reminder Groups'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('提醒组 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({}).passthrough().describe('批量操作参数'),
        },
      },
    },
  },
  responses: {
    200: successResponse(z.array(ReminderTemplateOpenApiSchema), '操作成功'),
    400: errorResponse('参数验证失败'),
  },
});

// ============================================================================
// Schedule Module Schemas
// ============================================================================

const ScheduleTaskOpenApiSchema = z.object({
  id: z.string().uuid().describe('调度任务 ID'),
  name: z.string().describe('任务名称'),
  description: z.string().nullable().optional().describe('任务描述'),
  sourceModule: z.string().describe('来源模块'),
  status: z.string().describe('任务状态'),
  enabled: z.boolean().describe('是否启用'),
  createdAt: z.number().describe('创建时间'),
  updatedAt: z.number().describe('更新时间'),
});

const CreateScheduleTaskOpenApiSchema = z.object({
  name: z.string().min(1).describe('任务名称'),
  sourceModule: z.string().describe('来源模块'),
  sourceEntityId: z.string().describe('来源实体 ID'),
  description: z.string().optional().describe('任务描述'),
  schedule: z.object({}).passthrough().describe('调度配置 (cron)'),
  retryPolicy: z.object({}).passthrough().optional().describe('重试策略'),
  enabled: z.boolean().optional().describe('是否启用'),
});

const UpdateScheduleTaskOpenApiSchema = z.object({
  schedule: z.object({}).passthrough().optional().describe('调度配置'),
  retryPolicy: z.object({}).passthrough().optional().describe('重试策略'),
  enabled: z.boolean().optional().describe('是否启用'),
  description: z.string().optional().describe('任务描述'),
});

const BatchScheduleOperationOpenApiSchema = z.object({
  taskIds: z.array(z.string().uuid()).describe('任务 ID 列表'),
  operation: z.enum(['pause', 'resume']).describe('批量操作类型'),
});

const BatchResultOpenApiSchema = z.object({
  success: z.array(z.string()).describe('成功的任务 ID'),
  failed: z.array(z.object({
    taskId: z.string(),
    error: z.string(),
  })).describe('失败的任务'),
  total: z.number().describe('总数'),
  successCount: z.number().describe('成功数'),
  failedCount: z.number().describe('失败数'),
});

registry.register('ScheduleTask', ScheduleTaskOpenApiSchema);
registry.register('CreateScheduleTask', CreateScheduleTaskOpenApiSchema);
registry.register('UpdateScheduleTask', UpdateScheduleTaskOpenApiSchema);
registry.register('BatchScheduleOperation', BatchScheduleOperationOpenApiSchema);
registry.register('BatchResult', BatchResultOpenApiSchema);

// ============================================================================
// Schedule API Paths
// ============================================================================

// POST /schedules/tasks/batch
registry.registerPath({
  method: 'post',
  path: '/api/v1/schedules/tasks/batch',
  summary: '批量操作调度任务',
  tags: ['Schedule Tasks'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: BatchScheduleOperationOpenApiSchema,
        },
      },
    },
  },
  responses: {
    200: successResponse(BatchResultOpenApiSchema, '批量操作完成'),
    400: errorResponse('参数验证失败'),
    401: errorResponse('未授权'),
  },
});

// POST /schedules/tasks
registry.registerPath({
  method: 'post',
  path: '/api/v1/schedules/tasks',
  summary: '创建调度任务',
  tags: ['Schedule Tasks'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateScheduleTaskOpenApiSchema,
        },
      },
    },
  },
  responses: {
    201: successResponse(ScheduleTaskOpenApiSchema, '创建成功'),
    400: errorResponse('参数验证失败'),
    401: errorResponse('未授权'),
  },
});

// GET /schedules/tasks
registry.registerPath({
  method: 'get',
  path: '/api/v1/schedules/tasks',
  summary: '查询调度任务列表',
  tags: ['Schedule Tasks'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      sourceModule: z.string().optional().describe('来源模块过滤'),
      sourceEntityId: z.string().optional().describe('来源实体 ID 过滤'),
      status: z.string().optional().describe('状态过滤'),
      enabled: z.string().optional().describe('启用状态过滤'),
      search: z.string().optional().describe('搜索关键字'),
      page: z.string().optional().describe('页码'),
      limit: z.string().optional().describe('每页数量'),
      sortBy: z.string().optional().describe('排序字段'),
      sortOrder: z.string().optional().describe('排序方向'),
    }),
  },
  responses: {
    200: successResponse(z.array(ScheduleTaskOpenApiSchema), '查询成功'),
    401: errorResponse('未授权'),
  },
});

// GET /schedules/tasks/:id
registry.registerPath({
  method: 'get',
  path: '/api/v1/schedules/tasks/{id}',
  summary: '获取调度任务详情',
  tags: ['Schedule Tasks'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('任务 ID'),
    }),
  },
  responses: {
    200: successResponse(ScheduleTaskOpenApiSchema, '获取成功'),
    404: errorResponse('任务不存在'),
  },
});

// PUT /schedules/tasks/:id
registry.registerPath({
  method: 'put',
  path: '/api/v1/schedules/tasks/{id}',
  summary: '更新调度任务',
  tags: ['Schedule Tasks'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('任务 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateScheduleTaskOpenApiSchema,
        },
      },
    },
  },
  responses: {
    200: successResponse(ScheduleTaskOpenApiSchema, '更新成功'),
    400: errorResponse('参数验证失败'),
    404: errorResponse('任务不存在'),
  },
});

// DELETE /schedules/tasks/:id
registry.registerPath({
  method: 'delete',
  path: '/api/v1/schedules/tasks/{id}',
  summary: '删除调度任务',
  tags: ['Schedule Tasks'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('任务 ID'),
    }),
  },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('任务不存在'),
  },
});

// POST /schedules/tasks/:id/pause
registry.registerPath({
  method: 'post',
  path: '/api/v1/schedules/tasks/{id}/pause',
  summary: '暂停调度任务',
  tags: ['Schedule Tasks'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('任务 ID'),
    }),
  },
  responses: {
    200: successResponse(ScheduleTaskOpenApiSchema, '暂停成功'),
    404: errorResponse('任务不存在'),
  },
});

// POST /schedules/tasks/:id/resume
registry.registerPath({
  method: 'post',
  path: '/api/v1/schedules/tasks/{id}/resume',
  summary: '恢复调度任务',
  tags: ['Schedule Tasks'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('任务 ID'),
    }),
  },
  responses: {
    200: successResponse(ScheduleTaskOpenApiSchema, '恢复成功'),
    404: errorResponse('任务不存在'),
  },
});

// POST /schedules/tasks/:id/trigger
registry.registerPath({
  method: 'post',
  path: '/api/v1/schedules/tasks/{id}/trigger',
  summary: '手动触发调度任务',
  tags: ['Schedule Tasks'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('任务 ID'),
    }),
  },
  responses: {
    200: successResponse(z.null(), '触发成功'),
    404: errorResponse('任务不存在'),
  },
});

// ============================================================================
// Notification Module Schemas
// ============================================================================

const NotificationOpenApiSchema = z.object({
  id: z.string().uuid().describe('通知 ID'),
  type: z.string().describe('通知类型'),
  category: z.string().optional().describe('通知分类'),
  title: z.string().describe('通知标题'),
  content: z.string().describe('通知内容'),
  status: z.string().describe('通知状态'),
  isRead: z.boolean().describe('是否已读'),
  createdAt: z.number().describe('创建时间'),
  updatedAt: z.number().describe('更新时间'),
});

const CreateNotificationOpenApiSchema = z.object({
  type: z.string().describe('通知类型'),
  category: z.string().optional().describe('通知分类'),
  title: z.string().min(1).describe('通知标题'),
  content: z.string().describe('通知内容'),
  identityId: z.string().describe('目标用户 ID'),
  channels: z.array(z.string()).optional().describe('通知渠道'),
  metadata: z.object({}).passthrough().optional().describe('附加元数据'),
});

const UpdateNotificationOpenApiSchema = z.object({
  title: z.string().optional().describe('通知标题'),
  content: z.string().optional().describe('通知内容'),
  status: z.string().optional().describe('通知状态'),
});

const MarkAsReadBatchOpenApiSchema = z.object({
  notificationIds: z.array(z.string().uuid()).describe('通知 ID 列表'),
});

const DeleteNotificationsBatchOpenApiSchema = z.object({
  notificationIds: z.array(z.string().uuid()).describe('通知 ID 列表'),
});

const CleanupOldNotificationsOpenApiSchema = z.object({
  identityId: z.string().describe('用户 ID'),
  beforeDate: z.number().optional().describe('截止日期 (timestamp)'),
});

const BatchOperationResultOpenApiSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  affected: z.number().describe('影响的记录数'),
});

registry.register('Notification', NotificationOpenApiSchema);
registry.register('CreateNotification', CreateNotificationOpenApiSchema);
registry.register('UpdateNotification', UpdateNotificationOpenApiSchema);
registry.register('MarkAsReadBatch', MarkAsReadBatchOpenApiSchema);
registry.register('DeleteNotificationsBatch', DeleteNotificationsBatchOpenApiSchema);
registry.register('CleanupOldNotifications', CleanupOldNotificationsOpenApiSchema);

// ============================================================================
// Notification API Paths
// ============================================================================

// POST /notifications
registry.registerPath({
  method: 'post',
  path: '/api/v1/notifications',
  summary: '创建通知',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateNotificationOpenApiSchema,
        },
      },
    },
  },
  responses: {
    201: successResponse(NotificationOpenApiSchema, '创建成功'),
    400: errorResponse('参数验证失败'),
    401: errorResponse('未授权'),
  },
});

// GET /notifications
registry.registerPath({
  method: 'get',
  path: '/api/v1/notifications',
  summary: '查询通知列表',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      identityId: z.string().optional().describe('用户 ID'),
      type: z.string().optional().describe('通知类型过滤'),
      category: z.string().optional().describe('分类过滤'),
      status: z.string().optional().describe('状态过滤'),
      isRead: z.string().optional().describe('是否已读过滤'),
      keyword: z.string().optional().describe('关键字搜索'),
      page: z.string().optional().describe('页码'),
      limit: z.string().optional().describe('每页数量'),
      sortBy: z.string().optional().describe('排序字段'),
      sortOrder: z.string().optional().describe('排序方向'),
    }),
  },
  responses: {
    200: successResponse(z.array(NotificationOpenApiSchema), '查询成功'),
    401: errorResponse('未授权'),
  },
});

// GET /notifications/:id
registry.registerPath({
  method: 'get',
  path: '/api/v1/notifications/{id}',
  summary: '获取通知详情',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('通知 ID'),
    }),
  },
  responses: {
    200: successResponse(NotificationOpenApiSchema, '获取成功'),
    404: errorResponse('通知不存在'),
  },
});

// PUT /notifications/:id
registry.registerPath({
  method: 'put',
  path: '/api/v1/notifications/{id}',
  summary: '更新通知',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('通知 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateNotificationOpenApiSchema,
        },
      },
    },
  },
  responses: {
    200: successResponse(NotificationOpenApiSchema, '更新成功'),
    400: errorResponse('参数验证失败'),
    404: errorResponse('通知不存在'),
  },
});

// DELETE /notifications/:id
registry.registerPath({
  method: 'delete',
  path: '/api/v1/notifications/{id}',
  summary: '删除通知',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('通知 ID'),
    }),
  },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('通知不存在'),
  },
});

// POST /notifications/:id/read
registry.registerPath({
  method: 'post',
  path: '/api/v1/notifications/{id}/read',
  summary: '标记通知为已读',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().describe('通知 ID'),
    }),
  },
  responses: {
    200: successResponse(z.null(), '标记成功'),
    404: errorResponse('通知不存在'),
  },
});

// POST /notifications/batch/read
registry.registerPath({
  method: 'post',
  path: '/api/v1/notifications/batch/read',
  summary: '批量标记通知为已读',
  tags: ['Notifications - Batch'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: MarkAsReadBatchOpenApiSchema,
        },
      },
    },
  },
  responses: {
    200: successResponse(BatchOperationResultOpenApiSchema, '批量标记成功'),
    400: errorResponse('参数验证失败'),
  },
});

// POST /notifications/batch/delete
registry.registerPath({
  method: 'post',
  path: '/api/v1/notifications/batch/delete',
  summary: '批量删除通知',
  tags: ['Notifications - Batch'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: DeleteNotificationsBatchOpenApiSchema,
        },
      },
    },
  },
  responses: {
    200: successResponse(BatchOperationResultOpenApiSchema, '批量删除成功'),
    400: errorResponse('参数验证失败'),
  },
});

// POST /notifications/cleanup
registry.registerPath({
  method: 'post',
  path: '/api/v1/notifications/cleanup',
  summary: '清理过期通知',
  tags: ['Notifications - Batch'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CleanupOldNotificationsOpenApiSchema,
        },
      },
    },
  },
  responses: {
    200: successResponse(BatchOperationResultOpenApiSchema, '清理成功'),
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

// ============================================================================
// Editor Module Schemas
// ============================================================================

const EditorWorkspaceOpenApiSchema = z.object({
  id: z.string().uuid().describe('工作区 ID'),
  name: z.string().describe('工作区名称'),
  projectPath: z.string().describe('项目路径'),
  projectType: z.string().describe('项目类型'),
  createdAt: z.number().describe('创建时间'),
  updatedAt: z.number().describe('更新时间'),
});

const CreateEditorWorkspaceOpenApiSchema = z.object({
  name: z.string().min(1).describe('工作区名称'),
  projectPath: z.string().min(1).describe('项目路径'),
  projectType: z.string().min(1).describe('项目类型'),
});

const UpdateEditorWorkspaceOpenApiSchema = z.object({
  name: z.string().optional().describe('工作区名称'),
  projectPath: z.string().optional().describe('项目路径'),
  projectType: z.string().optional().describe('项目类型'),
});

const EditorDocumentOpenApiSchema = z.object({
  id: z.string().uuid().describe('文档 ID'),
  workspaceId: z.string().uuid().describe('所属工作区 ID'),
  name: z.string().describe('文档名称'),
  content: z.string().optional().describe('文档内容'),
  createdAt: z.number().describe('创建时间'),
  updatedAt: z.number().describe('更新时间'),
});

const CreateDocumentOpenApiSchema = z.object({
  workspaceId: z.string().uuid().describe('所属工作区 ID'),
  name: z.string().min(1).describe('文档名称'),
  content: z.string().optional().describe('文档内容'),
  folderId: z.string().uuid().optional().describe('文件夹 ID'),
});

const UpdateDocumentOpenApiSchema = z.object({
  name: z.string().optional().describe('文档名称'),
  content: z.string().optional().describe('文档内容'),
});

registry.register('EditorWorkspace', EditorWorkspaceOpenApiSchema);
registry.register('CreateEditorWorkspace', CreateEditorWorkspaceOpenApiSchema);
registry.register('UpdateEditorWorkspace', UpdateEditorWorkspaceOpenApiSchema);
registry.register('EditorDocument', EditorDocumentOpenApiSchema);
registry.register('CreateDocument', CreateDocumentOpenApiSchema);
registry.register('UpdateDocument', UpdateDocumentOpenApiSchema);

// ============================================================================
// Editor Workspace API Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/editor/workspaces',
  summary: '创建工作区',
  tags: ['Editor Workspaces'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateEditorWorkspaceOpenApiSchema } } } },
  responses: {
    201: successResponse(EditorWorkspaceOpenApiSchema, '创建成功'),
    400: errorResponse('参数验证失败'),
    401: errorResponse('未授权'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/editor/workspaces',
  summary: '查询工作区列表',
  tags: ['Editor Workspaces'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.array(EditorWorkspaceOpenApiSchema), '查询成功'),
    401: errorResponse('未授权'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/editor/workspaces/{id}',
  summary: '获取工作区详情',
  tags: ['Editor Workspaces'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid().describe('工作区 ID') }) },
  responses: {
    200: successResponse(EditorWorkspaceOpenApiSchema, '获取成功'),
    404: errorResponse('工作区不存在'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/editor/workspaces/{id}',
  summary: '更新工作区',
  tags: ['Editor Workspaces'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid().describe('工作区 ID') }),
    body: { content: { 'application/json': { schema: UpdateEditorWorkspaceOpenApiSchema } } },
  },
  responses: {
    200: successResponse(EditorWorkspaceOpenApiSchema, '更新成功'),
    404: errorResponse('工作区不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/editor/workspaces/{id}',
  summary: '删除工作区',
  tags: ['Editor Workspaces'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid().describe('工作区 ID') }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('工作区不存在'),
  },
});

// ============================================================================
// Editor Document API Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/editor/documents',
  summary: '创建文档',
  tags: ['Editor Documents'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateDocumentOpenApiSchema } } } },
  responses: {
    201: successResponse(EditorDocumentOpenApiSchema, '创建成功'),
    400: errorResponse('参数验证失败'),
    401: errorResponse('未授权'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/editor/documents',
  summary: '查询文档列表',
  tags: ['Editor Documents'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      workspaceId: z.string().optional().describe('工作区 ID 过滤'),
      folderId: z.string().optional().describe('文件夹 ID 过滤'),
    }),
  },
  responses: {
    200: successResponse(z.array(EditorDocumentOpenApiSchema), '查询成功'),
    401: errorResponse('未授权'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/editor/documents/{id}',
  summary: '获取文档详情',
  tags: ['Editor Documents'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid().describe('文档 ID') }) },
  responses: {
    200: successResponse(EditorDocumentOpenApiSchema, '获取成功'),
    404: errorResponse('文档不存在'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/editor/documents/{id}',
  summary: '更新文档',
  tags: ['Editor Documents'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid().describe('文档 ID') }),
    body: { content: { 'application/json': { schema: UpdateDocumentOpenApiSchema } } },
  },
  responses: {
    200: successResponse(EditorDocumentOpenApiSchema, '更新成功'),
    404: errorResponse('文档不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/editor/documents/{id}',
  summary: '删除文档',
  tags: ['Editor Documents'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid().describe('文档 ID') }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('文档不存在'),
  },
});

// ============================================================================
// Setting Module Schemas
// ============================================================================

const UserSettingOpenApiSchema = z.object({
  identityId: z.string().describe('用户 ID'),
  settings: z.object({}).passthrough().describe('用户设置数据'),
  updatedAt: z.number().describe('更新时间'),
});

const UpdateUserSettingOpenApiSchema = z.object({
  settings: z.object({}).passthrough().describe('要更新的设置项'),
});

const ImportSettingsOpenApiSchema = z.object({
  data: z.string().describe('JSON 格式的设置数据'),
  overwrite: z.boolean().optional().describe('是否覆盖现有设置'),
});

registry.register('UserSetting', UserSettingOpenApiSchema);
registry.register('UpdateUserSetting', UpdateUserSettingOpenApiSchema);
registry.register('ImportSettings', ImportSettingsOpenApiSchema);

// ============================================================================
// Setting API Paths
// ============================================================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/settings',
  summary: '获取用户设置',
  tags: ['Settings'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(UserSettingOpenApiSchema, '获取成功'),
    401: errorResponse('未授权'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/settings',
  summary: '更新用户设置',
  tags: ['Settings'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: UpdateUserSettingOpenApiSchema } } } },
  responses: {
    200: successResponse(UserSettingOpenApiSchema, '更新成功'),
    400: errorResponse('参数验证失败'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/settings/reset',
  summary: '重置用户设置',
  tags: ['Settings'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(UserSettingOpenApiSchema, '重置成功'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/settings/export',
  summary: '导出设置',
  tags: ['Settings'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.object({}).passthrough(), '导出成功'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/settings/import',
  summary: '导入设置',
  tags: ['Settings'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: ImportSettingsOpenApiSchema } } } },
  responses: {
    201: successResponse(UserSettingOpenApiSchema, '导入成功'),
    400: errorResponse('参数验证失败'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/settings/defaults',
  summary: '获取默认设置',
  tags: ['Settings'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.object({}).passthrough(), '获取成功'),
  },
});

// ============================================================================
// Governance Module Schemas
// ============================================================================

const GovernanceRuleOpenApiSchema = z.object({
  id: z.string().uuid().describe('规则 ID'),
  code: z.string().describe('规则代码'),
  name: z.string().describe('规则名称'),
  description: z.string().optional().describe('规则描述'),
  severity: z.string().describe('严重级别'),
  status: z.string().describe('规则状态'),
  tags: z.array(z.string()).optional().describe('标签'),
  createdAt: z.number().describe('创建时间'),
  updatedAt: z.number().describe('更新时间'),
});

const CreateGovernanceRuleOpenApiSchema = z.object({
  code: z.string().min(1).describe('规则代码'),
  name: z.string().min(1).describe('规则名称'),
  description: z.string().optional().describe('规则描述'),
  severity: z.string().describe('严重级别'),
  tags: z.array(z.string()).optional().describe('标签'),
  content: z.string().describe('规则内容'),
});

const UpdateGovernanceRuleOpenApiSchema = z.object({
  name: z.string().optional().describe('规则名称'),
  description: z.string().optional().describe('规则描述'),
  severity: z.string().optional().describe('严重级别'),
  tags: z.array(z.string()).optional().describe('标签'),
  content: z.string().optional().describe('规则内容'),
});

const RuleRevisionOpenApiSchema = z.object({
  id: z.string().uuid().describe('修订 ID'),
  ruleId: z.string().uuid().describe('规则 ID'),
  version: z.number().describe('版本号'),
  content: z.string().describe('修订内容'),
  createdAt: z.number().describe('创建时间'),
});

registry.register('GovernanceRule', GovernanceRuleOpenApiSchema);
registry.register('CreateGovernanceRule', CreateGovernanceRuleOpenApiSchema);
registry.register('UpdateGovernanceRule', UpdateGovernanceRuleOpenApiSchema);
registry.register('RuleRevision', RuleRevisionOpenApiSchema);

// ============================================================================
// Governance API Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/governance/rules',
  summary: '创建治理规则',
  tags: ['Governance Rules'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateGovernanceRuleOpenApiSchema } } } },
  responses: {
    201: successResponse(GovernanceRuleOpenApiSchema, '创建成功'),
    400: errorResponse('参数验证失败'),
    401: errorResponse('未授权'),
    403: errorResponse('权限不足'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/governance/rules/{id}',
  summary: '更新治理规则',
  tags: ['Governance Rules'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid().describe('规则 ID') }),
    body: { content: { 'application/json': { schema: UpdateGovernanceRuleOpenApiSchema } } },
  },
  responses: {
    200: successResponse(GovernanceRuleOpenApiSchema, '更新成功'),
    400: errorResponse('参数验证失败'),
    403: errorResponse('权限不足'),
    404: errorResponse('规则不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/governance/rules/{id}',
  summary: '删除治理规则',
  tags: ['Governance Rules'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid().describe('规则 ID') }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    403: errorResponse('权限不足'),
    404: errorResponse('规则不存在'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/governance/rules/by-code/{code}',
  summary: '按代码获取规则',
  tags: ['Governance Rules'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ code: z.string().describe('规则代码') }) },
  responses: {
    200: successResponse(GovernanceRuleOpenApiSchema, '获取成功'),
    404: errorResponse('规则不存在'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/governance/rules/{id}',
  summary: '按 ID 获取规则',
  tags: ['Governance Rules'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid().describe('规则 ID') }) },
  responses: {
    200: successResponse(GovernanceRuleOpenApiSchema, '获取成功'),
    404: errorResponse('规则不存在'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/governance/rules',
  summary: '查询治理规则列表',
  tags: ['Governance Rules'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      status: z.string().optional().describe('状态过滤'),
      severity: z.string().optional().describe('严重级别过滤'),
      tags: z.string().optional().describe('标签过滤 (逗号分隔)'),
      page: z.string().optional().describe('页码'),
      pageSize: z.string().optional().describe('每页数量'),
    }),
  },
  responses: {
    200: successResponse(z.array(GovernanceRuleOpenApiSchema), '查询成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/governance/rules/{id}/revisions',
  summary: '获取规则修订历史',
  tags: ['Governance Rules'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid().describe('规则 ID') }),
    query: z.object({
      page: z.string().optional().describe('页码'),
      pageSize: z.string().optional().describe('每页数量'),
    }),
  },
  responses: {
    200: successResponse(z.array(RuleRevisionOpenApiSchema), '查询成功'),
  },
});

// ============================================================================
// Account Module Schemas
// ============================================================================

const AccountProfileOpenApiSchema = z.object({
  id: z.string().uuid().describe('账户 ID'),
  email: z.string().email().describe('邮箱'),
  displayName: z.string().optional().describe('显示名称'),
  avatar: z.string().optional().describe('头像 URL'),
  createdAt: z.number().describe('创建时间'),
  updatedAt: z.number().describe('更新时间'),
});

const UpdateAccountOpenApiSchema = z.object({
  displayName: z.string().optional().describe('显示名称'),
  avatar: z.string().optional().describe('头像 URL'),
});

const CheckAvailabilityOpenApiSchema = z.object({
  field: z.string().describe('要检查的字段名'),
  value: z.string().describe('要检查的值'),
});

const CloseAccountOpenApiSchema = z.object({
  reason: z.string().optional().describe('注销原因'),
  confirmation: z.string().describe('确认字符串'),
});

registry.register('AccountProfile', AccountProfileOpenApiSchema);
registry.register('UpdateAccount', UpdateAccountOpenApiSchema);
registry.register('CheckAvailability', CheckAvailabilityOpenApiSchema);
registry.register('CloseAccount', CloseAccountOpenApiSchema);

// ============================================================================
// Account API Paths
// ============================================================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/account/me',
  summary: '获取当前用户资料',
  tags: ['Account'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(AccountProfileOpenApiSchema, '获取成功'),
    401: errorResponse('未授权'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/account/me',
  summary: '更新当前用户资料',
  tags: ['Account'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: UpdateAccountOpenApiSchema } } } },
  responses: {
    200: successResponse(AccountProfileOpenApiSchema, '更新成功'),
    400: errorResponse('参数验证失败'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/account/availability',
  summary: '检查可用性',
  tags: ['Account'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CheckAvailabilityOpenApiSchema } } } },
  responses: {
    200: successResponse(z.object({ available: z.boolean() }), '检查完成'),
    400: errorResponse('参数验证失败'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/account/me/close',
  summary: '注销账户',
  tags: ['Account'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CloseAccountOpenApiSchema } } } },
  responses: {
    200: successResponse(z.null(), '账户已注销'),
    400: errorResponse('参数验证失败'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/account/me',
  summary: '注销账户（别名）',
  tags: ['Account'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.null(), '账户已注销'),
  },
});

// ============================================================================
// Repository Module Schemas
// ============================================================================

const RepositoryOpenApiSchema = z.object({
  id: z.string().uuid().describe('仓库 ID'),
  name: z.string().describe('仓库名称'),
  type: z.string().describe('仓库类型'),
  description: z.string().optional().describe('仓库描述'),
  status: z.string().describe('仓库状态'),
  createdAt: z.number().describe('创建时间'),
  updatedAt: z.number().describe('更新时间'),
});

const CreateRepositoryOpenApiSchema = z.object({
  name: z.string().min(1).describe('仓库名称'),
  type: z.string().min(1).describe('仓库类型'),
  path: z.string().optional().describe('仓库路径'),
  description: z.string().optional().describe('仓库描述'),
  config: z.object({}).passthrough().optional().describe('仓库配置'),
});

const UpdateRepositoryOpenApiSchema = z.object({
  name: z.string().optional().describe('仓库名称'),
  description: z.string().optional().describe('仓库描述'),
  config: z.object({}).passthrough().optional().describe('仓库配置'),
});

const ResourceOpenApiSchema = z.object({
  id: z.string().uuid().describe('资源 ID'),
  repositoryId: z.string().uuid().describe('所属仓库 ID'),
  name: z.string().describe('资源名称'),
  type: z.string().describe('资源类型'),
  mimeType: z.string().optional().describe('MIME 类型'),
  createdAt: z.number().describe('创建时间'),
  updatedAt: z.number().describe('更新时间'),
});

const CreateResourceOpenApiSchema = z.object({
  name: z.string().min(1).describe('资源名称'),
  type: z.string().min(1).describe('资源类型'),
  mimeType: z.string().optional().describe('MIME 类型'),
  content: z.string().optional().describe('资源内容'),
  folderId: z.string().uuid().optional().describe('文件夹 ID'),
});

const UpdateResourceOpenApiSchema = z.object({
  name: z.string().optional().describe('资源名称'),
  content: z.string().optional().describe('资源内容'),
  metadata: z.object({}).passthrough().optional().describe('元数据'),
});

registry.register('Repository', RepositoryOpenApiSchema);
registry.register('CreateRepository', CreateRepositoryOpenApiSchema);
registry.register('UpdateRepository', UpdateRepositoryOpenApiSchema);
registry.register('Resource', ResourceOpenApiSchema);
registry.register('CreateResource', CreateResourceOpenApiSchema);
registry.register('UpdateResource', UpdateResourceOpenApiSchema);

// ============================================================================
// Repository API Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/repositories',
  summary: '创建仓库',
  tags: ['Repositories'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateRepositoryOpenApiSchema } } } },
  responses: {
    201: successResponse(RepositoryOpenApiSchema, '创建成功'),
    400: errorResponse('参数验证失败'),
    401: errorResponse('未授权'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/repositories',
  summary: '查询仓库列表',
  tags: ['Repositories'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      status: z.string().optional().describe('状态过滤'),
      type: z.string().optional().describe('类型过滤'),
    }),
  },
  responses: {
    200: successResponse(z.array(RepositoryOpenApiSchema), '查询成功'),
    401: errorResponse('未授权'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/repositories/{id}',
  summary: '获取仓库详情',
  tags: ['Repositories'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid().describe('仓库 ID') }) },
  responses: {
    200: successResponse(RepositoryOpenApiSchema, '获取成功'),
    404: errorResponse('仓库不存在'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/repositories/{id}',
  summary: '更新仓库',
  tags: ['Repositories'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid().describe('仓库 ID') }),
    body: { content: { 'application/json': { schema: UpdateRepositoryOpenApiSchema } } },
  },
  responses: {
    200: successResponse(RepositoryOpenApiSchema, '更新成功'),
    404: errorResponse('仓库不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/repositories/{id}',
  summary: '删除仓库',
  tags: ['Repositories'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid().describe('仓库 ID') }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('仓库不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/repositories/{id}/archive',
  summary: '归档仓库',
  tags: ['Repositories'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid().describe('仓库 ID') }) },
  responses: {
    200: successResponse(RepositoryOpenApiSchema, '归档成功'),
    404: errorResponse('仓库不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/repositories/{id}/activate',
  summary: '激活仓库',
  tags: ['Repositories'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid().describe('仓库 ID') }) },
  responses: {
    200: successResponse(RepositoryOpenApiSchema, '激活成功'),
    404: errorResponse('仓库不存在'),
  },
});

// ============================================================================
// Repository Resource API Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/repositories/{repoId}/resources',
  summary: '创建资源',
  tags: ['Resources'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ repoId: z.string().uuid().describe('仓库 ID') }),
    body: { content: { 'application/json': { schema: CreateResourceOpenApiSchema } } },
  },
  responses: {
    201: successResponse(ResourceOpenApiSchema, '创建成功'),
    400: errorResponse('参数验证失败'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/repositories/{repoId}/resources',
  summary: '查询仓库资源列表',
  tags: ['Resources'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ repoId: z.string().uuid().describe('仓库 ID') }),
    query: z.object({
      folderId: z.string().optional().describe('文件夹 ID 过滤'),
      status: z.string().optional().describe('状态过滤'),
    }),
  },
  responses: {
    200: successResponse(z.array(ResourceOpenApiSchema), '查询成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/resources/{id}',
  summary: '获取资源详情',
  tags: ['Resources'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid().describe('资源 ID') }) },
  responses: {
    200: successResponse(ResourceOpenApiSchema, '获取成功'),
    404: errorResponse('资源不存在'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/resources/{id}',
  summary: '更新资源',
  tags: ['Resources'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid().describe('资源 ID') }),
    body: { content: { 'application/json': { schema: UpdateResourceOpenApiSchema } } },
  },
  responses: {
    200: successResponse(ResourceOpenApiSchema, '更新成功'),
    404: errorResponse('资源不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/resources/{id}',
  summary: '删除资源',
  tags: ['Resources'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid().describe('资源 ID') }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('资源不存在'),
  },
});
