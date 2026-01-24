/**
 * Repository Routes Aggregator
 * 聚合所有仓储相关的 HTTP 路由
 *
 * 模块化设计 - 按用例拆分:
 * - Core: 仓库基础 CRUD 和设置
 * - Sync: 同步操作和版本控制
 * - Permission: 权限管理和共享
 * - Resource: 资源管理
 * - Folder: 文件夹结构
 * - Statistics: 统计和分析
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { registerRepositoryCoreRoutes } from './repository-core.routes';
import { registerRepositorySyncRoutes } from './repository-sync.routes';
import { registerRepositoryPermissionRoutes } from './repository-permission.routes';
import { registerRepositoryResourceRoutes } from './repository-resource.routes';
import { registerRepositoryFolderRoutes } from './repository-folder.routes';
import { registerRepositoryStatisticsRoutes } from './repository-statistics.routes';
import { RepositoryModule } from '@dailyuse/infrastructure-server';

export function registerRepositoryRoutes(repositoryModule: RepositoryModule): Router {
  const router: Router = ExpressRouter();

  // ============ 仓库核心路由 ============
  // POST   /api/repositories              - 创建仓库
  // GET    /api/repositories              - 获取列表
  // GET    /api/repositories/:id          - 获取详情
  // PUT    /api/repositories/:id          - 更新仓库
  // DELETE /api/repositories/:id          - 删除仓库
  // PATCH  /api/repositories/:id/settings - 更新设置
  router.use('/', registerRepositoryCoreRoutes(repositoryModule.repositoryService));

  // ============ 仓库同步路由 ============
  // POST   /api/repositories/:id/sync           - 同步
  // GET    /api/repositories/:id/sync-status    - 获取状态
  // POST   /api/repositories/:id/pull           - 拉取
  // POST   /api/repositories/:id/push           - 推送
  // GET    /api/repositories/:id/changes        - 获取变更
  // POST   /api/repositories/:id/revert         - 恢复版本
  router.use('/', registerRepositorySyncRoutes(repositoryModule.syncService));

  // ============ 仓库权限路由 ============
  // POST   /api/repositories/:id/permissions           - 添加权限
  // GET    /api/repositories/:id/permissions           - 获取权限列表
  // PUT    /api/repositories/:id/permissions/:userId   - 更新权限
  // DELETE /api/repositories/:id/permissions/:userId   - 删除权限
  // POST   /api/repositories/:id/share                 - 分享
  // GET    /api/repositories/:id/share-links           - 获取分享链接
  router.use('/', registerRepositoryPermissionRoutes(repositoryModule.permissionService));

  // ============ 资源路由 ============
  // 资源文件管理
  router.use('/resources', registerRepositoryResourceRoutes(repositoryModule.resourceService));

  // ============ 文件夹路由 ============
  // 文件夹结构管理
  router.use('/folders', registerRepositoryFolderRoutes(repositoryModule.folderService));

  // ============ 仓库统计路由 ============
  // 统计和分析
  router.use('/statistics', registerRepositoryStatisticsRoutes(repositoryModule.statisticsService));

  return router;
}
