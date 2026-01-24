/**
 * @file app.ts
 * @description Express 应用入口配置，包含中间件、路由和错误处理。
 * @date 2025-01-22
 */

import express, {
  type Express,
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { registerAccountRoutes } from './modules/account/interface';
import { registerAuthenticationRoutes } from './modules/authentication/interface';
import { registerTaskRoutes } from './modules/task/interface';
import { registerGoalRoutes } from './modules/goal/interface';
import { registerGoalFolderRoutes } from './modules/goal/interface/goal-folder.routes';
import { registerWeightSnapshotRoutes } from './modules/goal/interface/goal-weight-snapshot.routes';
import { registerReminderRoutes } from './modules/reminder/interface';
import { registerScheduleRoutes } from './modules/schedule/interface';
import { registerNotificationRoutes } from './modules/notification/interface';
import { registerSSERoutes } from './modules/notification/interface/sseRoutes';
import { registerSettingRoutes } from './modules/setting/interface';
import { registerEditorRoutes } from './modules/editor/interface';
import { registerRepositoryRoutes } from './modules/repository/interface';
import { registerMetricsRoutes } from './modules/metrics/interface';
import { registerAIRoutes } from './modules/ai/interface';
import { registerDashboardRoutes } from './modules/dashboard/interface';
import crossModuleRouter from './shared/infrastructure/http/routes/crossModuleRoutes';
import infrastructureRouter from './shared/infrastructure/http/routes/infrastructureRoutes';
import {
  authMiddleware,
} from './shared/infrastructure/http/middlewares/index';
import { setupSwagger } from './shared/infrastructure/config/swagger';
import { createLogger } from '@dailyuse/utils';
import { performanceMiddleware } from './shared/infrastructure/http/middlewares/performance.middleware';
import { getCorsOrigins, isAllCorsOriginsAllowed } from './shared/infrastructure/config/env.js';
import { GoalModule, AccountModule, TaskModule, ScheduleModule, ReminderModule, NotificationModule, SettingModule, AIModule, RepositoryModule, DashboardModule } from '@dailyuse/infrastructure-server';

export interface AppDependencies {
  goalModule: GoalModule;
  accountModule: AccountModule;
  taskModule: TaskModule;
  scheduleModule: ScheduleModule;
  reminderModule: ReminderModule;
  notificationModule: NotificationModule;
  settingModule: SettingModule;
  aiModule: AIModule;
  repositoryModule: RepositoryModule;
  dashboardModule: DashboardModule;
}

export const createApp = (deps: AppDependencies): Express => {
  const logger = createLogger('Express');
  const app: Express = express();

  // CORS 配置（从统一环境配置模块获取）
  const allowedOrigins = getCorsOrigins();
  const allowAllOrigins = isAllCorsOriginsAllowed();

  // Middlewares
  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        if (!origin) return callback(null, true);
        if (allowAllOrigins) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: !allowAllOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Skip-Auth', 'Cache-Control'],
      maxAge: 86400,
    }),
  );

  app.use(
    compression({
      filter: (req, res) => {
        if (req.path.includes('/sse/')) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );

  app.use(performanceMiddleware);

  const api = Router();

  api.use('/accounts', registerAccountRoutes(deps.accountModule));
  api.use('/auth', registerAuthenticationRoutes());
  api.use('/tasks', authMiddleware, registerTaskRoutes(deps.taskModule));
  
  // INJECTED SERVICE
  api.use('/goals', authMiddleware, registerGoalRoutes(deps.goalModule));

  api.use('/goal-folders', authMiddleware, registerGoalFolderRoutes());
  api.use('/weight-snapshots', authMiddleware, registerWeightSnapshotRoutes());
  api.use('/reminders', authMiddleware, registerReminderRoutes(deps.reminderModule));
  api.use('/schedules', authMiddleware, registerScheduleRoutes(deps.scheduleModule));
  api.use('/editor', authMiddleware, registerEditorRoutes());
  api.use('/repositories', authMiddleware, registerRepositoryRoutes(deps.repositoryModule));
  api.use('/settings', authMiddleware, registerSettingRoutes(deps.settingModule));
  api.use('/metrics', authMiddleware, registerMetricsRoutes());
  api.use('/dashboard', authMiddleware, registerDashboardRoutes(deps.dashboardModule));
  api.use('/cross-module', authMiddleware, crossModuleRouter);
  api.use('/sse', registerSSERoutes());
  api.use('/notifications', authMiddleware, registerNotificationRoutes(
    deps.notificationModule.notificationService,
    deps.notificationModule.notificationTemplateService,
    deps.notificationModule.notificationChannelService
  ));
  api.use('/ai', authMiddleware, registerAIRoutes(deps.aiModule));

  logger.info('Notification and event system initialized successfully');

  setupSwagger(app);

  app.use('/', infrastructureRouter);
  app.use('/api', api);
  app.use('/api/v1', api);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Not Found' });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Express error handler caught error', err, {
      status: err?.status,
      code: err?.code,
      message: err?.message,
    });
    const status = Number(err?.status ?? 500);
    res.status(status).json({
      code: err?.code ?? 'INTERNAL_ERROR',
      message: err?.message ?? 'Internal Server Error',
    });
  });
  
  return app;
};
