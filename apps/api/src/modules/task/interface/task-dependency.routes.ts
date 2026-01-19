import { Router, type Router as ExpressRouter } from 'express';

/**
 * @swagger
 * tags:
 *   - name: Task Dependencies
 *     description: 任务依赖关系管理相关接口
 */

/**
 * TaskDependency 路由配置
 * RESTful API for task dependency management
 */
const router: ExpressRouter = Router();

// ============ 任务依赖管理路由 ============

/**
 * @swagger
 * /tasks/{taskUuid}/dependencies:
 *   post:
 *     tags: [Task Dependencies]
 *     summary: 创建任务依赖关系
 *     description: 为指定任务创建前置依赖关系
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 后续任务UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - predecessorTaskUuid
 *             properties:
 *               predecessorTaskUuid:
 *                 type: string
 *                 description: 前置任务UUID
 *               dependencyType:
 *                 type: string
 *                 enum: [FINISH_TO_START, START_TO_START, FINISH_TO_FINISH, START_TO_FINISH]
 *                 default: FINISH_TO_START
 *                 description: 依赖类型
 *               lagDays:
 *                 type: number
 *                 description: 延迟天数（可选）
 *     responses:
 *       201:
 *         description: 依赖关系创建成功
 *       400:
 *         description: 请求参数错误或会形成循环依赖
 *       404:
 *         description: 任务不存在
 *   get:
 *     tags: [Task Dependencies]
 *     summary: 获取任务的所有前置依赖
 *     description: 获取指定任务的所有前置依赖列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     responses:
 *       200:
 *         description: 成功返回依赖列表
 */
router.post('/:taskUuid/dependencies', (_req, res) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
});
router.get('/:taskUuid/dependencies', (_req, res) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
});

/**
 * @swagger
 * /tasks/{taskUuid}/dependents:
 *   get:
 *     tags: [Task Dependencies]
 *     summary: 获取依赖此任务的所有任务
 *     description: 获取所有将此任务作为前置依赖的任务列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     responses:
 *       200:
 *         description: 成功返回依赖此任务的任务列表
 */
router.get('/:taskUuid/dependents', (_req, res) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
});

/**
 * @swagger
 * /tasks/{taskUuid}/dependency-chain:
 *   get:
 *     tags: [Task Dependencies]
 *     summary: 获取任务的完整依赖链
 *     description: 获取任务的完整依赖链信息，包括所有前置和后续任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     responses:
 *       200:
 *         description: 成功返回依赖链信息
 */
router.get('/:taskUuid/dependency-chain', (_req, res) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
});

/**
 * @swagger
 * /tasks/dependencies/validate:
 *   post:
 *     tags: [Task Dependencies]
 *     summary: 验证依赖关系
 *     description: 验证依赖关系是否有效（不实际创建），检查是否会形成循环依赖
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - predecessorTaskUuid
 *               - successorTaskUuid
 *             properties:
 *               predecessorTaskUuid:
 *                 type: string
 *                 description: 前置任务UUID
 *               successorTaskUuid:
 *                 type: string
 *                 description: 后续任务UUID
 *     responses:
 *       200:
 *         description: 返回验证结果
 */
router.post('/dependencies/validate', (_req, res) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
});

/**
 * @swagger
 * /tasks/dependencies/{uuid}:
 *   delete:
 *     tags: [Task Dependencies]
 *     summary: 删除依赖关系
 *     description: 删除指定的任务依赖关系
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 依赖关系UUID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 依赖关系不存在
 *   put:
 *     tags: [Task Dependencies]
 *     summary: 更新依赖关系
 *     description: 更新依赖关系的类型或延迟天数
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 依赖关系UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dependencyType:
 *                 type: string
 *                 enum: [FINISH_TO_START, START_TO_START, FINISH_TO_FINISH, START_TO_FINISH]
 *                 description: 依赖类型
 *               lagDays:
 *                 type: number
 *                 description: 延迟天数
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 依赖关系不存在
 */
router.delete('/dependencies/:uuid', (_req, res) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
});
router.put('/dependencies/:uuid', (_req, res) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
});

export function registerTaskDependencyRoutes(): Router {
  return router;
}
