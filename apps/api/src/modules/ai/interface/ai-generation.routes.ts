/**
 * AI Generation Routes
 * 处理 AI 内容生成功能
 *
 * 端点:
 * - POST   /api/ai/generate/goal        - 生成 Goal
 * - POST   /api/ai/generate/key-results - 生成关键结果
 * - POST   /api/ai/generate/tasks       - 生成任务模板
 * - POST   /api/ai/generate/knowledge   - 生成知识文档
 * - GET    /api/ai/generation-tasks/:uuid - 获取生成任务状态
 * - GET    /api/ai/generation-tasks/:uuid/documents - 获取生成的文档
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { AIGenerationApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIGenerationRoutes');
const responseBuilder = createResponseBuilder();


export function registerGenerationRoutes(service: AIGenerationApplicationService): Router {
  const router: Router = ExpressRouter();

  // 所有生成路由需要认证
  router.use(authMiddleware);

  /**
   * @swagger
   * /api/ai/generate/goal:
   *   post:
   *     tags: [AI Generation]
   *     summary: 生成 Goal
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - idea
   *             properties:
   *               idea:
   *                 type: string
   *                 description: 用户的想法或需求
   *               context:
   *                 type: string
   *                 description: 额外的上下文信息
   *               provider:
   *                 type: string
   *                 description: 指定的 AI Provider (可选)
   *     responses:
   *       202:
   *         description: 生成任务已提交
   *       400:
   *         description: 请求参数错误
   */
  router.post('/goal', async (req: AuthenticatedRequest, res) => {
    try {
      const task = await service.generateGoal(req.user.accountUuid, req.body);
      res.status(202).json(responseBuilder.success(task, 'Goal generation started'));
    } catch (error) {
      logger.error('Generate goal failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/generate/key-results:
   *   post:
   *     tags: [AI Generation]
   *     summary: 生成关键结果
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - goalUuid
   *               - context
   *             properties:
   *               goalUuid:
   *                 type: string
   *                 description: Goal 的 UUID
   *               context:
   *                 type: string
   *                 description: Goal 的上下文信息
   *               count:
   *                 type: integer
   *                 description: 生成的关键结果数量 (默认3)
   *               provider:
   *                 type: string
   *                 description: 指定的 AI Provider (可选)
   *     responses:
   *       202:
   *         description: 生成任务已提交
   *       400:
   *         description: 请求参数错误
   */
  router.post('/key-results', async (req: AuthenticatedRequest, res) => {
    try {
      const task = await service.generateKeyResults(req.user.accountUuid, req.body);
      res.status(202).json(responseBuilder.success(task, 'Key results generation started'));
    } catch (error) {
      logger.error('Generate key results failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/generate/tasks:
   *   post:
   *     tags: [AI Generation]
   *     summary: 生成任务模板
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - context
   *             properties:
   *               context:
   *                 type: string
   *                 description: 任务生成的上下文
   *               goalUuid:
   *                 type: string
   *                 description: 关联的 Goal UUID (可选)
   *               count:
   *                 type: integer
   *                 description: 生成的任务数量 (默认5)
   *               provider:
   *                 type: string
   *                 description: 指定的 AI Provider (可选)
   *     responses:
   *       202:
   *         description: 生成任务已提交
   *       400:
   *         description: 请求参数错误
   */
  router.post('/tasks', async (req: AuthenticatedRequest, res) => {
    try {
      const task = await service.generateTasks(req.user.accountUuid, req.body);
      res.status(202).json(responseBuilder.success(task, 'Tasks generation started'));
    } catch (error) {
      logger.error('Generate tasks failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/generate/knowledge:
   *   post:
   *     tags: [AI Generation]
   *     summary: 生成知识文档
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - topic
   *             properties:
   *               topic:
   *                 type: string
   *                 description: 知识主题
   *               depth:
   *                 type: string
   *                 enum: [basic, intermediate, advanced]
   *                 description: 生成的深度等级
   *               format:
   *                 type: string
   *                 enum: [markdown, html, text]
   *                 description: 输出格式
   *               provider:
   *                 type: string
   *                 description: 指定的 AI Provider (可选)
   *     responses:
   *       202:
   *         description: 生成任务已提交
   *       400:
   *         description: 请求参数错误
   */
  router.post('/knowledge', async (req: AuthenticatedRequest, res) => {
    try {
      const task = await service.generateKnowledge(req.user.accountUuid, req.body);
      res.status(202).json(responseBuilder.success(task, 'Knowledge generation started'));
    } catch (error) {
      logger.error('Generate knowledge failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/generation-tasks/{uuid}:
   *   get:
   *     tags: [AI Generation]
   *     summary: 获取生成任务状态
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *           description: 生成任务的 UUID
   *     responses:
   *       200:
   *         description: 成功获取任务状态
   *       404:
   *         description: 任务不存在
   */
  router.get('/tasks/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      const task = await service.getGenerationTaskStatus(req.params.uuid);
      res.json(responseBuilder.success(task, 'Task status retrieved'));
    } catch (error) {
      logger.error('Get task status failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/generation-tasks/{uuid}/documents:
   *   get:
   *     tags: [AI Generation]
   *     summary: 获取生成的文档列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *           description: 生成任务的 UUID
   *     responses:
   *       200:
   *         description: 成功获取文档列表
   *       404:
   *         description: 任务不存在
   */
  router.get('/tasks/:uuid/documents', async (req: AuthenticatedRequest, res) => {
    try {
      const documents = await service.getGeneratedDocuments(req.params.uuid);
      res.json(responseBuilder.success(documents, 'Documents retrieved'));
    } catch (error) {
      logger.error('Get generated documents failed:', error);
      throw error;
    }
  });


  return router;
}
