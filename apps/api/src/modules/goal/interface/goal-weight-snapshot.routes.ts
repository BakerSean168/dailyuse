/**
 * @file weightSnapshotRoutes.ts
 * @description 权重快照路由配置，定义权重相关的 HTTP 接口。
 * @date 2025-01-22
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';

const _stubController = (_req: Request, res: Response) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
};
// import { authMiddleware } from '../../../../middleware/auth';

const router: ExpressRouter = Router();

/**
 * 更新 KeyResult 权重并创建快照。
 *
 * @route POST /api/goals/:goalUuid/key-results/:krUuid/weight
 * @param req.body.newWeight - 新权重值 (1-10)
 * @param req.body.reason - 变更原因 (可选)
 */
router.post(
  '/goals/:goalUuid/key-results/:krUuid/weight',
  // authMiddleware,
  _stubController,
);

/**
 * 查询 Goal 的所有权重快照。
 *
 * @route GET /api/goals/:goalUuid/weight-snapshots
 * @param req.query.page - 页码
 * @param req.query.pageSize - 每页数量
 */
router.get(
  '/goals/:goalUuid/weight-snapshots',
  // authMiddleware,
  _stubController,
);

/**
 * 查询 KeyResult 的权重快照历史。
 *
 * @route GET /api/key-results/:krUuid/weight-snapshots
 * @param req.query.page - 页码
 * @param req.query.pageSize - 每页数量
 */
router.get(
  '/key-results/:krUuid/weight-snapshots',
  // authMiddleware,
  _stubController,
);

/**
 * 查询权重趋势数据（用于图表展示）。
 *
 * @route GET /api/goals/:goalUuid/weight-trend
 * @param req.query.startTime - 起始时间戳
 * @param req.query.endTime - 结束时间戳
 */
router.get(
  '/goals/:goalUuid/weight-trend',
  // authMiddleware,
  _stubController,
);

/**
 * 对比多个时间点的权重分配。
 *
 * @route GET /api/goals/:goalUuid/weight-comparison
 * @param req.query.timePoints - 逗号分隔的时间戳 (最多 5 个)
 */
router.get(
  '/goals/:goalUuid/weight-comparison',
  // authMiddleware,
  _stubController,
);

export function registerWeightSnapshotRoutes(): Router {
  return router;
}
