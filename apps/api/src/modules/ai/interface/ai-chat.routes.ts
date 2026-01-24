/**
 * AI Chat Routes
 * 处理 AI 对话功能
 *
 * 端点:
 * - POST   /api/ai/chat              - 发送消息（普通响应）
 * - POST   /api/ai/chat/stream        - 发送消息（流式响应）
 * - POST   /api/ai/conversations      - 创建对话
 * - GET    /api/ai/conversations      - 获取对话列表
 * - GET    /api/ai/conversations/:id  - 获取特定对话
 * - DELETE /api/ai/conversations/:id  - 删除对话
 * - GET    /api/ai/quota              - 获取配额状态
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { AIChatApplicationService, AIConversationService, GetQuota } from '@dailyuse/application-server/ai';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIChatRoutes');
const responseBuilder = createResponseBuilder();

export function registerChatRoutes(
  chatService: AIChatApplicationService,
  conversationService: AIConversationService,
  getQuotaService: GetQuota
): Router {
  const router: Router = ExpressRouter();

  // 所有对话路由需要认证
  router.use(authMiddleware);

  /**
   * @swagger
   * /api/ai/chat:
   *   post:
   *     tags: [AI Chat]
   *     summary: 发送消息（普通响应）
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - conversationId
   *               - message
   *             properties:
   *               conversationId:
   *                 type: string
   *                 description: 对话 ID
   *               message:
   *                 type: string
   *                 description: 用户消息内容
   *               provider:
   *                 type: string
   *                 description: 指定的 AI Provider (可选)
   *               model:
   *                 type: string
   *                 description: 指定的模型 (可选)
   *     responses:
   *       200:
   *         description: 成功获取 AI 回复
   *       400:
   *         description: 请求参数错误
   *       404:
   *         description: 对话不存在
   */
  router.post('/', async (req: AuthenticatedRequest, res) => {
    try {
      const response = await chatService.sendMessage(
        req.user.accountUuid,
        req.body.conversationId,
        req.body.message,
        req.body.provider,
        req.body.model,
      );
      res.json(responseBuilder.success(response, 'Message sent successfully'));
    } catch (error) {
      logger.error('Send message failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/chat/stream:
   *   post:
   *     tags: [AI Chat]
   *     summary: 发送消息（流式响应）
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - conversationId
   *               - message
   *             properties:
   *               conversationId:
   *                 type: string
   *                 description: 对话 ID
   *               message:
   *                 type: string
   *                 description: 用户消息内容
   *               provider:
   *                 type: string
   *                 description: 指定的 AI Provider (可选)
   *               model:
   *                 type: string
   *                 description: 指定的模型 (可选)
   *     responses:
   *       200:
   *         description: 流式 AI 回复 (Server-Sent Events)
   *       400:
   *         description: 请求参数错误
   *       404:
   *         description: 对话不存在
   */
  router.post('/stream', async (req: AuthenticatedRequest, res) => {
    try {
      // 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 流式发送消息
      await chatService.sendMessageStream(
        req.user.accountUuid,
        req.body.conversationId,
        req.body.message,
        (chunk) => {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        },
        req.body.provider,
        req.body.model,
      );

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      logger.error('Send stream message failed:', error);
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
      res.end();
    }
  });

  /**
   * @swagger
   * /api/ai/conversations:
   *   post:
   *     tags: [AI Chat]
   *     summary: 创建新对话
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
   *             properties:
   *               title:
   *                 type: string
   *                 description: 对话标题
   *               context:
   *                 type: string
   *                 description: 对话上下文 (可选)
   *     responses:
   *       201:
   *         description: 对话创建成功
   *       400:
   *         description: 请求参数错误
   */
  router.post('/conversations', async (req: AuthenticatedRequest, res) => {
    try {
      const conversation = await conversationService.createConversation(
        req.user.accountUuid,
        req.body.title
      );
      res.status(201).json(responseBuilder.success(conversation, 'Conversation created'));
    } catch (error) {
      logger.error('Create conversation failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/conversations:
   *   get:
   *     tags: [AI Chat]
   *     summary: 获取对话列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: 分页限制
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: 分页偏移
   *     responses:
   *       200:
   *         description: 成功获取对话列表
   */
  router.get('/conversations', async (req: AuthenticatedRequest, res) => {
    try {
      const limit = Number(req.query.limit) || 20;
      const offset = Number(req.query.offset) || 0;
      const page = Math.floor(offset / limit) + 1;
      const result = await conversationService.listConversations(req.user.accountUuid, page, limit);
      res.json(responseBuilder.success(result, 'Conversations retrieved'));
    } catch (error) {
      logger.error('Get conversations failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/conversations/{id}:
   *   get:
   *     tags: [AI Chat]
   *     summary: 获取特定对话详情（包括消息历史）
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           description: 对话 ID
   *     responses:
   *       200:
   *         description: 成功获取对话详情
   *       404:
   *         description: 对话不存在
   */
  router.get('/conversations/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const conversationEntity = await conversationService.getConversation(req.params.id);
      if (!conversationEntity) {
        throw new Error('Conversation not found');
      }
      res.json(responseBuilder.success(conversationEntity.toClientDTO(), 'Conversation retrieved'));
    } catch (error) {
      logger.error('Get conversation detail failed:', error);
      if (error instanceof Error && error.message === 'Conversation not found') {
          res.status(404).json(responseBuilder.error('Conversation not found'));
          return;
      }
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/conversations/{id}:
   *   delete:
   *     tags: [AI Chat]
   *     summary: 删除对话
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           description: 对话 ID
   *     responses:
   *       200:
   *         description: 对话删除成功
   *       404:
   *         description: 对话不存在
   */
  router.delete('/conversations/:id', async (req: AuthenticatedRequest, res) => {
    try {
      await conversationService.deleteConversation(req.params.id);
      res.json(responseBuilder.success(null, 'Conversation deleted'));
    } catch (error) {
      logger.error('Delete conversation failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/quota:
   *   get:
   *     tags: [AI Chat]
   *     summary: 获取配额状态
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取配额信息
   */
  router.get('/quota', async (req: AuthenticatedRequest, res) => {
    try {
      const quota = await getQuotaService.execute(req.user.accountUuid);
      res.json(responseBuilder.success(quota, 'Quota retrieved successfully'));
    } catch (error) {
      logger.error('Get quota failed:', error);
      throw error;
    }
  });

  return router;
}
