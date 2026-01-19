/**
 * Repository Resource Routes
 * 资源管理相关路由定义
 */
import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { ResourceController } from '../controllers/ResourceController';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import multer from 'multer';

const router: RouterType = Router();

// 配置 multer 用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB 限制
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // 允许的文件类型
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'application/pdf',
      'text/plain',
      'text/markdown',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  },
});

// 所有路由都需要认证
router.use(authMiddleware);

// Resource CRUD 路由 - 使用静态方法
router.post('/resources', ResourceController.createResource);
router.get('/resources/:uuid', ResourceController.getResourceById);
router.get('/repositories/:repositoryUuid/resources', ResourceController.getResourcesByRepository);
router.put('/resources/:uuid/content', ResourceController.updateMarkdownContent);
router.delete('/resources/:uuid', ResourceController.deleteResource);

// 资源上传路由
router.post(
  '/repositories/:repositoryUuid/resources/upload',
  upload.single('file'),
  ResourceController.uploadResource,
);

router.post(
  '/repositories/:repositoryUuid/resources/upload-batch',
  upload.array('files', 20), // 最多 20 个文件
  ResourceController.uploadResources,
);

// 资源访问路由
router.get('/repositories/:repositoryUuid/assets/:filename', ResourceController.getAsset);

export function registerRepositoryResourceRoutes(): Router {
  return router;
}
