/**
 * @file crossModuleRoutes.ts
 * @description 跨模块查询路由配置，提供跨领域的数据聚合接口。
 * @date 2025-01-22
 */

import { Router, type Request, type Response } from 'express';
// import { GoalCrossModuleQueryService } from '@/modules/goal/application/services/GoalCrossModuleQueryService';

const router: Router = Router();

// TODO: GoalCrossModuleQueryService 文件缺失，暂时禁用此功能
// const goalQueryService = GoalCrossModuleQueryService.getInstance();

/**
 * 获取可用于任务绑定的目标列表。
 *
 * @remarks
 * 返回特定状态（如进行中）的目标列表，供前端在创建或编辑任务时选择关联目标。
 *
 * @route GET /api/v1/cross-module/goals/for-task-binding
 * @param req.query.accountUuid - 账户 UUID (可选，优先使用 Token 中的用户信息)
 * @param req.query.status - 目标状态过滤 (可选，逗号分隔)
 */
router.get('/goals/for-task-binding', async (req: Request, res: Response) => {
  try {
    // accountUuid 可以从 query 参数获取，或从认证 token 中获取（如果使用了 authMiddleware）
    const accountUuid = (req.query.accountUuid as string) || (req as any).user?.accountUuid;
    const status = req.query.status
      ? (req.query.status as string).split(',')
      : undefined;

    if (!accountUuid) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: 'accountUuid is required or authentication is missing',
      });
    }

    const goals = await goalQueryService.getGoalsForTaskBinding({
      accountUuid,
      status: status as any,
    });

    return res.json({
      code: 200,
      success: true,
      data: goals,
      message: 'Success',
    });
  } catch (error) {
    console.error('[CrossModuleAPI] Failed to get goals for task binding:', error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取目标的关键结果列表（用于任务绑定）。
 *
 * @route GET /api/v1/cross-module/goals/:goalUuid/key-results/for-task-binding
 * @param req.params.goalUuid - 目标 UUID
 */
router.get('/goals/:goalUuid/key-results/for-task-binding', async (req: Request, res: Response) => {
  try {
    const { goalUuid } = req.params;

    const keyResults = await goalQueryService.getKeyResultsForTaskBinding(goalUuid);

    return res.json({
      code: 200,
      success: true,
      data: keyResults,
      message: 'Success',
    });
  } catch (error) {
    console.error('[CrossModuleAPI] Failed to get key results for task binding:', error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 验证目标和关键结果的绑定是否有效。
 *
 * @remarks
 * 检查目标是否存在、关键结果是否属于该目标等业务规则。
 *
 * @route POST /api/v1/cross-module/goals/validate-binding
 * @param req.body.goalUuid - 目标 UUID
 * @param req.body.keyResultUuid - 关键结果 UUID
 */
router.post('/goals/validate-binding', async (req: Request, res: Response) => {
  try {
    const { goalUuid, keyResultUuid } = req.body;

    if (!goalUuid || !keyResultUuid) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: 'goalUuid and keyResultUuid are required',
      });
    }

    const result = await goalQueryService.validateGoalBinding(goalUuid, keyResultUuid);

    if (result.valid) {
      return res.json({
        code: 200,
        success: true,
        data: { valid: true },
        message: 'Valid binding',
      });
    } else {
      return res.status(400).json({
        code: 400,
        success: false,
        data: { valid: false },
        message: result.error || 'Invalid binding',
      });
    }
  } catch (error) {
    console.error('[CrossModuleAPI] Failed to validate goal binding:', error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;
