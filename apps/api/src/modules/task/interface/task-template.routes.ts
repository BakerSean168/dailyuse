import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';
import { registerTaskInstanceRoutes } from './task-instance.routes';

// Stub handler for not-yet-implemented endpoints
const _stubController = (_req: Request, res: Response) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
};

/**
 * @swagger
 * tags:
 *   - name: Task Templates
 *     description: 任务模板管理相关接口
 */

/**
 * TaskTemplate 路由配置
 * 采用 DDD 聚合根控制模式的 REST API 设计
 */
const router: ExpressRouter = Router();

/**
 * @swagger
 * /task-templates/{uuid}/instances:
 *   get:
 *     tags: [Task Templates]
 *     summary: 根据日期范围获取模板实例
 *     description: 获取指定任务模板在指定日期范围内的所有实例
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: number
 *         description: 起始日期（时间戳）
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: number
 *         description: 结束日期（时间戳）
 *     responses:
 *       200:
 *         description: 成功返回任务实例列表
 *       400:
 *         description: 缺少必需参数或参数格式错误
 *       404:
 *         description: 任务模板不存在
 */
router.get('/:uuid/instances', _stubController);

// ============ 子路由：任务实例 ============
// 注意：必须放在 /:uuid/instances 之后，否则会拦截所有 /instances 请求
router.use('/instances', registerTaskInstanceRoutes());

// ============ 聚合根操作路由 ============

/**
 * @swagger
 * /task-templates/{id}/activate:
 *   post:
 *     tags: [Task Templates]
 *     summary: 激活任务模板
 *     description: 将任务模板状态设置为激活
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     responses:
 *       200:
 *         description: 成功激活模板
 */
router.post('/:id/activate', _stubController);

/**
 * @swagger
 * /task-templates/{id}/pause:
 *   post:
 *     tags: [Task Templates]
 *     summary: 暂停任务模板
 *     description: 将任务模板状态设置为暂停
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     responses:
 *       200:
 *         description: 成功暂停模板
 */
router.post('/:id/pause', _stubController);

/**
 * @swagger
 * /task-templates/{id}/archive:
 *   post:
 *     tags: [Task Templates]
 *     summary: 归档任务模板
 *     description: 将任务模板状态设置为归档
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     responses:
 *       200:
 *         description: 成功归档模板
 */
router.post('/:id/archive', _stubController);

/**
 * @swagger
 * /task-templates/{id}/generate-instances:
 *   post:
 *     tags: [Task Templates]
 *     summary: 生成任务实例
 *     description: 根据模板和重复规则生成任务实例
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toDate
 *             properties:
 *               toDate:
 *                 type: number
 *                 description: 生成到的日期（时间戳）
 *     responses:
 *       200:
 *         description: 成功生成任务实例
 */
router.post('/:id/generate-instances', _stubController);

/**
 * @swagger
 * /task-templates/{id}/bind-goal:
 *   post:
 *     tags: [Task Templates]
 *     summary: 绑定到目标
 *     description: 将任务模板绑定到OKR目标
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - goalUuid
 *               - keyResultUuid
 *               - incrementValue
 *             properties:
 *               goalUuid:
 *                 type: string
 *                 description: 目标UUID
 *               keyResultUuid:
 *                 type: string
 *                 description: 关键结果UUID
 *               incrementValue:
 *                 type: number
 *                 description: 完成任务时增加的值
 *     responses:
 *       200:
 *         description: 成功绑定到目标
 */
router.post('/:id/bind-goal', _stubController);

/**
 * @swagger
 * /task-templates/{id}/unbind-goal:
 *   post:
 *     tags: [Task Templates]
 *     summary: 解除目标绑定
 *     description: 解除任务模板与OKR目标的绑定
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     responses:
 *       200:
 *         description: 成功解除绑定
 */
router.post('/:id/unbind-goal', _stubController);

// ============ 基本 CRUD 路由 ============

/**
 * @swagger
 * /task-templates:
 *   post:
 *     tags: [Task Templates]
 *     summary: 创建任务模板
 *     description: 创建新的任务模板
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - taskType
 *               - timeConfig
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               taskType:
 *                 type: string
 *                 enum: [ONE_TIME, RECURRING]
 *               timeConfig:
 *                 type: object
 *               recurrenceRule:
 *                 type: object
 *               reminderConfig:
 *                 type: object
 *               importance:
 *                 type: string
 *               urgency:
 *                 type: string
 *               folderUuid:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: 任务模板创建成功
 *   get:
 *     tags: [Task Templates]
 *     summary: 获取任务模板列表
 *     description: 获取用户的所有任务模板 (Story 2.5: 支持 sortBy 和 filterBy 参数)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [priority, dueDate, createdAt, importance]
 *           default: priority
 *         description: '(Story 2.5) 排序字段: priority (默认) | dueDate | createdAt | importance'
 *       - in: query
 *         name: filterBy
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: '(Story 2.5) 过滤条件: importance:vital|important|moderate|minor|trivial, status:active|completed|blocked|cancelled, dueDate:overdue|today|upcoming|noDueDate (可多个，AND关系)'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PAUSED, ARCHIVED, DELETED]
 *         description: 按状态过滤 (已弃用, 改用 filterBy=status:*)
 *       - in: query
 *         name: folderUuid
 *         schema:
 *           type: string
 *         description: 按文件夹过滤
 *       - in: query
 *         name: goalUuid
 *         schema:
 *           type: string
 *         description: 按目标过滤
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 按标签过滤（逗号分隔）
 *     responses:
 *       200:
 *         description: 成功返回任务模板列表
 *       400:
 *         description: 参数无效 (Story 2.5)
 */
router.post('/', _stubController);
router.get('/', _stubController);

/**
 * @swagger
 * /task-templates/{id}:
 *   get:
 *     tags: [Task Templates]
 *     summary: 获取任务模板详情
 *     description: 根据UUID获取任务模板详细信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *       - in: query
 *         name: includeChildren
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否包含子实体（实例和历史记录）
 *     responses:
 *       200:
 *         description: 成功返回任务模板详情
 *       404:
 *         description: 任务模板不存在
 *   delete:
 *     tags: [Task Templates]
 *     summary: 删除任务模板
 *     description: 删除任务模板及其所有实例
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 任务模板不存在
 */
router.get('/:id', _stubController);
router.delete('/:id', _stubController);

// ============ ONE_TIME Task Routes ============

/**
 * @swagger
 * /tasks/one-time:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 创建一次性任务
 *     description: 创建一个新的一次性任务
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - dueDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               importance:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 4
 *               urgency:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 4
 *               goalUuid:
 *                 type: string
 *               keyResultUuid:
 *                 type: string
 *               parentTaskUuid:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: 一次性任务创建成功
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取一次性任务列表
 *     description: 获取用户的所有一次性任务，支持多种过滤条件
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, BLOCKED, CANCELLED]
 *       - in: query
 *         name: goalUuid
 *         schema:
 *           type: string
 *       - in: query
 *         name: keyResultUuid
 *         schema:
 *           type: string
 *       - in: query
 *         name: parentTaskUuid
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 标签列表（逗号分隔）
 *       - in: query
 *         name: startDateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: startDateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dueDateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dueDateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: minImportance
 *         schema:
 *           type: number
 *       - in: query
 *         name: minUrgency
 *         schema:
 *           type: number
 *       - in: query
 *         name: priorityLevels
 *         schema:
 *           type: string
 *         description: 优先级（逗号分隔，如 HIGH,MEDIUM）
 *     responses:
 *       200:
 *         description: 成功返回任务列表
 */
router.post('/one-time', _stubController);
router.get('/one-time', _stubController);

/**
 * @swagger
 * /tasks/{uuid}:
 *   patch:
 *     tags: [One-Time Tasks]
 *     summary: 更新一次性任务
 *     description: 更新任务的基本信息（标题、描述、日期、优先级等）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: number
 *               dueDate:
 *                 type: number
 *               importance:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 4
 *               urgency:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 4
 *               estimatedMinutes:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               color:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: 任务更新成功
 *       404:
 *         description: 任务不存在
 */
router.patch('/:uuid', _stubController);

/**
 * @swagger
 * /tasks/{uuid}/history:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取任务历史记录
 *     description: 获取任务的所有变更历史
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     responses:
 *       200:
 *         description: 成功返回任务历史
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       action:
 *                         type: string
 *                       changes:
 *                         type: object
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: 任务不存在
 */
router.get('/:uuid/history', _stubController);

/**
 * @swagger
 * /tasks/today:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取今日任务
 *     description: 获取今天需要完成的所有任务
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回今日任务列表
 */
router.get('/today', _stubController);

/**
 * @swagger
 * /tasks/overdue:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取逾期任务
 *     description: 获取所有已逾期的任务
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回逾期任务列表
 */
router.get('/overdue', _stubController);

/**
 * @swagger
 * /tasks/upcoming:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取即将到期的任务
 *     description: 获取未来N天内到期的任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 7
 *         description: 未来天数
 *     responses:
 *       200:
 *         description: 成功返回即将到期的任务列表
 */
router.get('/upcoming', _stubController);

/**
 * @swagger
 * /tasks/by-priority:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 按优先级排序获取任务
 *     description: 获取按优先级降序排列的任务列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 成功返回按优先级排序的任务列表
 */
router.get('/by-priority', _stubController);

/**
 * @swagger
 * /tasks/dashboard:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取任务仪表板
 *     description: 获取任务仪表板数据（包括今日、逾期、即将到期、高优先级等）
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回仪表板数据
 */
router.get('/dashboard', _stubController);

/**
 * @swagger
 * /tasks/blocked:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取阻塞的任务
 *     description: 获取所有处于阻塞状态的任务
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回阻塞任务列表
 */
router.get('/blocked', _stubController);

/**
 * @swagger
 * /tasks/by-date-range:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 按日期范围获取任务
 *     description: 获取指定日期范围内的任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: 成功返回任务列表
 */
router.get('/by-date-range', _stubController);

/**
 * @swagger
 * /tasks/by-tags:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 按标签获取任务
 *     description: 根据标签获取任务列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tags
 *         required: true
 *         schema:
 *           type: string
 *         description: 标签列表（逗号分隔）
 *     responses:
 *       200:
 *         description: 成功返回任务列表
 */
router.get('/by-tags', _stubController);

/**
 * @swagger
 * /tasks/by-goal/{goalUuid}:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 根据目标获取任务
 *     description: 获取关联到指定目标的所有任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: goalUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功返回任务列表
 */
router.get('/by-goal/:goalUuid', _stubController);

/**
 * @swagger
 * /tasks/by-key-result/{keyResultUuid}:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 根据关键结果获取任务
 *     description: 获取关联到指定关键结果的所有任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyResultUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功返回任务列表
 */
router.get('/by-key-result/:keyResultUuid', _stubController);

/**
 * @swagger
 * /tasks/{uuid}/start:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 开始任务
 *     description: 将任务状态更改为进行中
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务已开始
 */
router.post('/:uuid/start', _stubController);

/**
 * @swagger
 * /tasks/{uuid}/complete:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 完成任务
 *     description: 将任务标记为已完成
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务已完成
 */
router.post('/:uuid/complete', _stubController);

/**
 * @swagger
 * /tasks/{uuid}/block:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 阻塞任务
 *     description: 将任务标记为阻塞状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 任务已阻塞
 */
router.post('/:uuid/block', _stubController);

/**
 * @swagger
 * /tasks/{uuid}/unblock:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 解除任务阻塞
 *     description: 解除任务的阻塞状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务阻塞已解除
 */
router.post('/:uuid/unblock', _stubController);

/**
 * @swagger
 * /tasks/{uuid}/cancel:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 取消任务
 *     description: 将任务标记为已取消
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 任务已取消
 */
router.post('/:uuid/cancel', _stubController);

/**
 * @swagger
 * /tasks/{uuid}/link-goal:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 关联任务到目标
 *     description: 将任务关联到指定的目标和关键结果
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - goalUuid
 *             properties:
 *               goalUuid:
 *                 type: string
 *               keyResultUuid:
 *                 type: string
 *     responses:
 *       200:
 *         description: 任务已关联到目标
 *   delete:
 *     tags: [One-Time Tasks]
 *     summary: 解除任务与目标的关联
 *     description: 解除任务与目标和关键结果的关联
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务已解除关联
 */
router.post('/:uuid/link-goal', _stubController);
router.delete('/:uuid/link-goal', _stubController);

/**
 * @swagger
 * /tasks/{parentUuid}/subtasks:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 创建子任务
 *     description: 为指定任务创建子任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentUuid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - dueDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               importance:
 *                 type: number
 *               urgency:
 *                 type: number
 *     responses:
 *       201:
 *         description: 子任务创建成功
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取子任务列表
 *     description: 获取指定任务的所有子任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功返回子任务列表
 */
router.post('/:parentUuid/subtasks', _stubController);
router.get('/:parentUuid/subtasks', _stubController);

/**
 * @swagger
 * /tasks/batch/update-priority:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 批量更新任务优先级
 *     description: 批量更新多个任务的重要性和紧急程度
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskUuids
 *             properties:
 *               taskUuids:
 *                 type: array
 *                 items:
 *                   type: string
 *               importance:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 4
 *               urgency:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 4
 *     responses:
 *       200:
 *         description: 批量更新成功
 */
router.post('/batch/update-priority', _stubController);

/**
 * @swagger
 * /tasks/batch/cancel:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 批量取消任务
 *     description: 批量取消多个任务
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskUuids
 *             properties:
 *               taskUuids:
 *                 type: array
 *                 items:
 *                   type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 批量取消成功
 */
router.post('/batch/cancel', _stubController);

export function registerTaskTemplateRoutes(): Router {
  return router;
}
