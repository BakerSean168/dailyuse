/**
 * AI Provider Routes
 * 处理 AI Provider 配置和管理
 *
 * 端点:
 * - POST   /api/ai/providers              - 创建 AI Provider 配置
 * - GET    /api/ai/providers              - 获取用户的 AI Provider 列表
 * - GET    /api/ai/providers/:uuid        - 获取特定 Provider 详情
 * - PUT    /api/ai/providers/:uuid        - 更新 Provider 配置
 * - DELETE /api/ai/providers/:uuid        - 删除 Provider 配置
 * - POST   /api/ai/providers/:uuid/test   - 测试 Provider 连接
 * - POST   /api/ai/providers/:uuid/set-default - 设为默认 Provider
 * - POST   /api/ai/providers/priorities   - 更新 Provider 优先级
 * - GET    /api/ai/providers/health       - 获取所有 Provider 健康状态
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { AIProviderConfigApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIProviderRoutes');
const responseBuilder = createResponseBuilder();

export function registerProviderRoutes(): Router {
  const router: Router = ExpressRouter();

  // 所有 Provider 路由需要认证
  router.use(authMiddleware);

  /**
   * @swagger
   * /api/ai/providers:
   *   post:
   *     tags: [AI Provider]
   *     summary: 创建 AI Provider 配置
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - providerType
   *               - apiKey
   *             properties:
   *               name:
   *                 type: string
   *                 description: Provider 名称
   *               providerType:
   *                 type: string
   *                 enum: [OPENAI, DEEPSEEK, GROQ, SILICONFLOW, OPENROUTER, CUSTOM]
   *                 description: Provider 类型
   *               apiKey:
   *                 type: string
   *                 description: API 密钥
   *               baseUrl:
   *                 type: string
   *                 description: 自定义基础 URL (可选)
   *               models:
   *                 type: array
   *                 description: 支持的模型列表
   *               priority:
   *                 type: number
   *                 description: 优先级 (可选)
   *     responses:
   *       201:
   *         description: Provider 创建成功
   *       400:
   *         description: 请求参数错误
   *       409:
   *         description: Provider 已存在
   */
  router.post('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await AIProviderConfigApplicationService.getInstance();
      const provider = await service.createProvider(req.user.accountUuid, req.body);
      res.status(201).json(responseBuilder.success(provider, 'Provider created successfully'));
    } catch (error) {
      logger.error('Create provider failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/providers:
   *   get:
   *     tags: [AI Provider]
   *     summary: 获取用户的 AI Provider 列表
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取 Provider 列表
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await AIProviderConfigApplicationService.getInstance();
      const providers = await service.getUserProviders(req.user.accountUuid);
      res.json(responseBuilder.success(providers, 'Providers retrieved'));
    } catch (error) {
      logger.error('Get providers failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/providers/{uuid}:
   *   get:
   *     tags: [AI Provider]
   *     summary: 获取特定 Provider 详情
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
   *         description: 成功获取 Provider 详情
   *       404:
   *         description: Provider 不存在
   */
  router.get('/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await AIProviderConfigApplicationService.getInstance();
      const provider = await service.getProviderDetail(req.params.uuid);
      res.json(responseBuilder.success(provider, 'Provider retrieved'));
    } catch (error) {
      logger.error('Get provider failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/providers/{uuid}:
   *   put:
   *     tags: [AI Provider]
   *     summary: 更新 Provider 配置
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
   *               name:
   *                 type: string
   *               apiKey:
   *                 type: string
   *               baseUrl:
   *                 type: string
   *               models:
   *                 type: array
   *               priority:
   *                 type: number
   *     responses:
   *       200:
   *         description: Provider 更新成功
   *       404:
   *         description: Provider 不存在
   */
  router.put('/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await AIProviderConfigApplicationService.getInstance();
      const updated = await service.updateProvider(req.params.uuid, req.body);
      res.json(responseBuilder.success(updated, 'Provider updated'));
    } catch (error) {
      logger.error('Update provider failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/providers/{uuid}:
   *   delete:
   *     tags: [AI Provider]
   *     summary: 删除 Provider 配置
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
   *         description: Provider 删除成功
   *       404:
   *         description: Provider 不存在
   */
  router.delete('/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await AIProviderConfigApplicationService.getInstance();
      await service.deleteProvider(req.params.uuid);
      res.json(responseBuilder.success(null, 'Provider deleted'));
    } catch (error) {
      logger.error('Delete provider failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/providers/{uuid}/test:
   *   post:
   *     tags: [AI Provider]
   *     summary: 测试 Provider 连接
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
   *         description: 连接测试成功
   *       400:
   *         description: 连接测试失败
   */
  router.post('/:uuid/test', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await AIProviderConfigApplicationService.getInstance();
      const result = await service.testConnection(req.params.uuid);
      res.json(responseBuilder.success(result, 'Connection test completed'));
    } catch (error) {
      logger.error('Test provider connection failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/providers/{uuid}/set-default:
   *   post:
   *     tags: [AI Provider]
   *     summary: 设为默认 Provider
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
   *         description: 默认 Provider 设置成功
   */
  router.post('/:uuid/set-default', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await AIProviderConfigApplicationService.getInstance();
      const updated = await service.setDefaultProvider(req.params.uuid);
      res.json(responseBuilder.success(updated, 'Default provider set'));
    } catch (error) {
      logger.error('Set default provider failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/providers/priorities:
   *   put:
   *     tags: [AI Provider]
   *     summary: 更新 Provider 优先级
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               priorities:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     uuid:
   *                       type: string
   *                     priority:
   *                       type: number
   *     responses:
   *       200:
   *         description: 优先级更新成功
   */
  router.put('/priorities', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await AIProviderConfigApplicationService.getInstance();
      const updated = await service.updatePriorities(req.body.priorities);
      res.json(responseBuilder.success(updated, 'Priorities updated'));
    } catch (error) {
      logger.error('Update priorities failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/ai/providers/health:
   *   get:
   *     tags: [AI Provider]
   *     summary: 获取所有 Provider 健康状态
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取健康状态
   */
  router.get('/health', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await AIProviderConfigApplicationService.getInstance();
      const healthStatus = await service.getHealthStatus();
      res.json(responseBuilder.success(healthStatus, 'Health status retrieved'));
    } catch (error) {
      logger.error('Get health status failed:', error);
      throw error;
    }
  });

  return router;
}
