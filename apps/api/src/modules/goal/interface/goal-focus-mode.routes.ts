/**
 * @file focusModeRoutes.ts
 * @description 专注模式路由配置，定义专注周期的 HTTP 接口路由。
 * @date 2025-01-22
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';

const _stubController = (_req: Request, res: Response) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
};

/**
 * FocusMode Routes
 * 专注周期模式路由
 */

const router: ExpressRouter = Router();

/**
 * @swagger
 * /api/goals/focus-mode:
 *   post:
 *     tags: [FocusMode]
 *     summary: 启用专注模式
 *     description: 选择 1-3 个目标进入专注周期，其他目标可选择隐藏
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - focusedGoalUuids
 *               - startTime
 *               - endTime
 *               - hiddenGoalsMode
 *             properties:
 *               focusedGoalUuids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 3
 *                 description: 要专注的目标 UUID 列表（1-3个）
 *                 example: ["goal-uuid-1", "goal-uuid-2"]
 *               startTime:
 *                 type: number
 *                 description: 专注周期开始时间戳（毫秒）
 *                 example: 1730260800000
 *               endTime:
 *                 type: number
 *                 description: 专注周期结束时间戳（毫秒）
 *                 example: 1732852800000
 *               hiddenGoalsMode:
 *                 type: string
 *                 enum: [hide_all, hide_folder, hide_none]
 *                 description: |
 *                   隐藏其他目标的模式：
 *                   - hide_all: 隐藏所有其他目标
 *                   - hide_folder: 隐藏文件夹视图
 *                   - hide_none: 不隐藏，仅标记专注目标
 *                 example: hide_all
 *     responses:
 *       201:
 *         description: 专注模式启用成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FocusModeResponse'
 *       400:
 *         description: 参数错误或业务规则违反
 *       401:
 *         description: 未授权
 */
router.post('/', _stubController);

/**
 * @swagger
 * /api/goals/focus-mode/{uuid}:
 *   delete:
 *     tags: [FocusMode]
 *     summary: 关闭专注模式（手动失效）
 *     description: 提前结束当前的专注周期
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 专注周期 UUID
 *     responses:
 *       200:
 *         description: 专注模式已关闭
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FocusModeResponse'
 *       400:
 *         description: 参数错误或专注周期不存在
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限操作此专注周期
 */
router.delete('/:uuid', _stubController);

/**
 * @swagger
 * /api/goals/focus-mode/{uuid}/extend:
 *   patch:
 *     tags: [FocusMode]
 *     summary: 延期专注模式
 *     description: 延长当前专注周期的结束时间（不允许缩短）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 专注周期 UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEndTime
 *             properties:
 *               newEndTime:
 *                 type: number
 *                 description: 新的结束时间戳（必须大于当前 endTime）
 *                 example: 1735444800000
 *     responses:
 *       200:
 *         description: 延期成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FocusModeResponse'
 *       400:
 *         description: 参数错误或新时间无效
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限操作此专注周期
 */
router.patch('/:uuid/extend', _stubController);

/**
 * @swagger
 * /api/goals/focus-mode/active:
 *   get:
 *     tags: [FocusMode]
 *     summary: 获取当前活跃的专注周期
 *     description: 获取当前用户正在进行的专注周期（每个账户同时只能有一个活跃周期）
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取活跃专注周期（可能为 null）
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/FocusModeResponse'
 *                 - type: 'null'
 *       401:
 *         description: 未授权
 */
router.get('/active', _stubController);

/**
 * @swagger
 * /api/goals/focus-mode/history:
 *   get:
 *     tags: [FocusMode]
 *     summary: 获取专注周期历史
 *     description: 获取当前用户的所有专注周期记录（包括活跃和已结束的）
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取历史记录
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FocusModeResponse'
 *       401:
 *         description: 未授权
 */
router.get('/history', _stubController);

/**
 * @swagger
 * components:
 *   schemas:
 *     FocusModeResponse:
 *       type: object
 *       properties:
 *         uuid:
 *           type: string
 *           description: 专注周期 UUID
 *         accountUuid:
 *           type: string
 *           description: 账户 UUID
 *         focusedGoalUuids:
 *           type: array
 *           items:
 *             type: string
 *           description: 专注的目标 UUID 列表
 *         startTime:
 *           type: number
 *           description: 开始时间戳
 *         endTime:
 *           type: number
 *           description: 结束时间戳
 *         hiddenGoalsMode:
 *           type: string
 *           enum: [hide_all, hide_folder, hide_none]
 *           description: 隐藏模式
 *         isActive:
 *           type: boolean
 *           description: 是否处于活跃状态
 *         actualEndTime:
 *           type: number
 *           nullable: true
 *           description: 实际结束时间戳（手动关闭时记录）
 *         remainingDays:
 *           type: number
 *           description: 剩余天数（向上取整）
 *         createdAt:
 *           type: number
 *           description: 创建时间戳
 *         updatedAt:
 *           type: number
 *           description: 更新时间戳
 */

export default router;
