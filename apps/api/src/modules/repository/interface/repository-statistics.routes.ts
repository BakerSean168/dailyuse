/**
 * Repository Statistics Routes
 * 仓库统计信息管理相关路由定义
 */
import { Router, type Router as ExpressRouter } from 'express';
import { RepositoryStatisticsController } from '../controllers/RepositoryStatisticsController';

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
const router: ExpressRouter = Router();

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 2000
 *                 message:
 *                   type: string
 *                   example: "Statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accountUuid:
 *                       type: string
 *                     totalRepositories:
 *                       type: integer
 *                     totalResources:
 *                       type: integer
 *                     totalSize:
 *                       type: integer
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/', RepositoryStatisticsController.getStatistics);

/**
 * @swagger
 * /repositories/statistics:
 *   put:
 *     tags: [Repository Statistics]
 *     summary: 更新仓库统计信息
 *     description: 更新当前账户的仓库统计数据
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalRepositories:
 *                 type: integer
 *               totalResources:
 *                 type: integer
 *               totalSize:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 统计信息更新成功
 *       401:
 *         description: 未授权
 *       400:
 *         description: 请求参数不正确
 *       500:
 *         description: 服务器错误
 */
router.put('/', RepositoryStatisticsController.updateStatistics);

/**
 * @swagger
 * /repositories/statistics:
 *   delete:
 *     tags: [Repository Statistics]
 *     summary: 删除仓库统计信息
 *     description: 删除当前账户的仓库统计数据
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计信息删除成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 统计信息不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/', RepositoryStatisticsController.deleteStatistics);

export function registerRepositoryStatisticsRoutes(): Router {
  return router;
}
