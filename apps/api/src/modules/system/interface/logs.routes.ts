import { type Request, type Response, Router, type Router as ExpressRouter } from 'express';
import { createLogger } from '@dailyuse/utils';

const router: ExpressRouter = Router();
const logger = createLogger('ClientLogs');

/**
 * 接收客户端日志
 * POST /api/logs
 */
router.post('/', (req: Request, res: Response) => {
  const { logs } = req.body;

  if (!Array.isArray(logs)) {
    return res.status(400).json({ message: 'Invalid logs format' });
  }

  // 批量处理日志
  logs.forEach((log: any) => {
    const { level, message, context, timestamp, metadata, error } = log;
    
    // 构建元数据
    const meta = {
      ...metadata,
      clientTimestamp: timestamp,
      clientContext: context,
      source: 'client',
    };

    // 根据级别记录日志
    switch (level) {
      case 'error':
        logger.error(message, error, meta);
        break;
      case 'warn':
        logger.warn(message, meta);
        break;
      case 'info':
        logger.info(message, meta);
        break;
      case 'debug':
        logger.debug(message, meta);
        break;
      default:
        logger.info(message, meta);
    }
  });

  return res.status(200).json({ success: true });
});

export default router;
