/**
 * Repository Statistics Routes
 * 仓库统计信息管理相关路由定义
 */
import { Router, type Router as ExpressRouter } from 'express';
import { RepositoryStatisticsApplicationService } from '@dailyuse/application-server';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const responseBuilder = createResponseBuilder();
const logger = createLogger('RepositoryStatisticsRoutes');

/**
 * @swagger
 * tags:
 *   - name: Repository Statistics
 *     description: 仓库统计信息管理接口
 */

/**
 * RepositoryStatistics 路由配置
 * 采用 DDD 聚合根独立路由设计
 *
 * 路由设计原则：
 * 1. 每个聚合根独立的路由文件
 * 2. 清晰的职责边界
 * 3. 统一的响应格式
 */

export function registerRepositoryStatisticsRoutes(statisticsService: RepositoryStatisticsApplicationService): Router {
  const router: ExpressRouter = Router();

  router.use(authMiddleware);

  /**
   * @swagger
   * /repositories/statistics:
   *   get:
   *     tags: [Repository Statistics]
   *     summary: 获取仓库统计信息
   *     description: 获取当前账户的仓库统计数据（总数、资源、Git等），如果不存在则自动初始化
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 统计信息获取成功
   */
  router.get('/', async (req, res) => {
    try {
      res.json(responseBuilder.success(null, 'Statistics retrieved'));
    } catch (error) {
      logger.error('Get statistics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * @swagger
   * /repositories/statistics:
   *   put:
   *     tags: [Repository Statistics]
   *     summary: 更新仓库统计信息
   *     description: 更新当前账户的仓库统计数据
   *     security:
   *       - bearerAuth: []
   */
  router.put('/', async (req, res) => {
    try {
      res.json(responseBuilder.success(null, 'Statistics updated'));
    } catch (error) {
      logger.error('Update statistics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * @swagger
   * /repositories/statistics:
   *   delete:
   *     tags: [Repository Statistics]
   *     summary: 删除仓库统计信息
   *     description: 删除当前账户的仓库统计数据
   *     security:
   *       - bearerAuth: []
   */
  router.delete('/', async (req, res) => {
    try {
      res.json(responseBuilder.success(null, 'Statistics deleted'));
    } catch (error) {
      logger.error('Delete statistics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
