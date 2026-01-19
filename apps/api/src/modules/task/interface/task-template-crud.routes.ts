/**
 * Task Template CRUD Routes
 * 任务模板的创建、读取、更新、删除操作
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';

// Stub handler for not-yet-implemented endpoints
const _stubController = (_req: Request, res: Response) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
};

/**
 * Task Template CRUD 路由配置
 */
const router: ExpressRouter = Router();

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

export function registerTaskTemplateCrudRoutes(): Router {
  return router;
}
