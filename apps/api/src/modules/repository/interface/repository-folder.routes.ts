/**
 * Repository Folder Routes
 * 文件夹管理相关路由定义
 */
import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
// import { FolderController } from '../controllers';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';

const router: Router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * @route POST /api/v1/repositories/:repositoryUuid/folders
 * @desc 创建文件夹
 */
// router.post('/repositories/:repositoryUuid/folders', FolderController.createFolder);

/**
 * @route GET /api/v1/repositories/:repositoryUuid/folders/tree
 * @desc 获取文件夹树
 */
// router.get('/repositories/:repositoryUuid/folders/tree', FolderController.getFolderTree);

/**
 * @route GET /api/v1/folders/:uuid
 * @desc 获取文件夹详情
 */
// router.get('/folders/:uuid', FolderController.getFolder);

/**
 * @route PATCH /api/v1/folders/:uuid/rename
 * @desc 重命名文件夹
 */
// router.patch('/folders/:uuid/rename', FolderController.renameFolder);

/**
 * @route PATCH /api/v1/folders/:uuid/move
 * @desc 移动文件夹
 */
// router.patch('/folders/:uuid/move', FolderController.moveFolder);

/**
 * @route DELETE /api/v1/folders/:uuid
 * @desc 删除文件夹
 */
// router.delete('/folders/:uuid', FolderController.deleteFolder);

export function registerRepositoryFolderRoutes(): Router {
  return router;
}
