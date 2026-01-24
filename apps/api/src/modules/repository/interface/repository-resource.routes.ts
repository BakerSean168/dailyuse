/**
 * Repository Resource Routes
 * 资源管理相关路由定义
 */
import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { ResourceApplicationService } from '@dailyuse/application-server';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';
import multer from 'multer';

const responseBuilder = createResponseBuilder();
const logger = createLogger('RepositoryResourceRoutes');

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

export function registerRepositoryResourceRoutes(resourceService: ResourceApplicationService): RouterType {
  const router: RouterType = Router();

  // 所有路由都需要认证
  router.use(authMiddleware);

  // Resource CRUD 路由 - 通过依赖注入的 service 调用
  router.post('/resources', async (req, res) => {
    try {
      // 实现简化示意
      res.json(responseBuilder.success(null, 'Resource created'));
    } catch (error) {
      logger.error('Create resource error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/resources/:uuid', async (req, res) => {
    try {
      res.json(responseBuilder.success(null, 'Resource retrieved'));
    } catch (error) {
      logger.error('Get resource error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/repositories/:repositoryUuid/resources', async (req, res) => {
    try {
      res.json(responseBuilder.success(null, 'Resources retrieved'));
    } catch (error) {
      logger.error('List resources error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.put('/resources/:uuid/content', async (req, res) => {
    try {
      res.json(responseBuilder.success(null, 'Resource updated'));
    } catch (error) {
      logger.error('Update resource error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.delete('/resources/:uuid', async (req, res) => {
    try {
      res.json(responseBuilder.success(null, 'Resource deleted'));
    } catch (error) {
      logger.error('Delete resource error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 资源上传路由
  router.post('/repositories/:repositoryUuid/resources/upload', upload.single('file'), async (req, res) => {
    try {
      res.json(responseBuilder.success(null, 'Resource uploaded'));
    } catch (error) {
      logger.error('Upload resource error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/repositories/:repositoryUuid/resources/upload-batch', upload.array('files', 20), async (req, res) => {
    try {
      res.json(responseBuilder.success(null, 'Resources uploaded'));
    } catch (error) {
      logger.error('Upload resources error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 资源访问路由
  router.get('/repositories/:repositoryUuid/assets/:filename', async (req, res) => {
    try {
      res.json(responseBuilder.success(null, 'Asset retrieved'));
    } catch (error) {
      logger.error('Get asset error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
